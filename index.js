const http = require('http');
const path = require('path');
const sqlite = require('sqlite');
const ptn = require('parse-torrent-name');
const isInvalidPath = require('is-invalid-path');
const fs = require('fs');
const slug = require('slug');
const rimraf = require('rimraf');
const Url = require('url');
require('perfect-print-js')

const helper = require('./helper');
const Tviso = require('./tviso');
const conf = require('./conf');
const tviso = new Tviso(conf.tviso.app, conf.tviso.secret);
const invalidPathRegex = /[<>:"/\\|?*]/ig;

process.on('unhandledRejection', e => {
  console.log('UnhandledRejection: ', e.message, e);
});

const reply = (res, rep) => {
    switch (typeof rep) {
        case "object":
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(rep));
            break;
        case "string":
        default:
            res.setHeader('Content-Type', 'text/plain');
            res.end(rep);
            break;
    }
}

const mediaMatches = (media, file) => {
    let val;

    // if its an episode it should match against a series/tvshow/episode
    if (((typeof file.episode === "number" || typeof file.season === "number") && !isTvshow(media)) ||
        (isTvshow(media) && (typeof file.episode !== "number" || typeof file.season !== "number"))
    ) {
        return false;
    }

    for (let attr in file) {
        val = file[attr];

        switch (attr) {
            case "title":
                if (media.name.toLowerCase() === val.toLowerCase() || slug(media.name, {lower: true}) === slug(val, {lower: true})) {
                    return true;
                }
                if (media.originalName.toLowerCase() === val.toLowerCase() || slug(media.originalName, {lower: true}) === slug(val, {lower: true})) {
                    return true;
                }
                break;
            case "year":
                if (media.year === val) {
                    return true;
                }
            break;
        }
    }

    return false;
}

const isTvshow = (media) => {
    return [1, 4, 5].indexOf(media.mediaType) !== -1
}

const cleanFolder = (baseFolder) => {
    let files = helper.getAllFolders(baseFolder),
        folder;

    helper.log("normal", "Looking for empty folders to delete");

    for(let k in files) {
        folder = files[k]

         // avoid removing c:\\ or baseFolder itself
        if (path.parse(folder).name != path.parse(baseFolder).name && helper.getAllFiles(folder).length == 0 && folder.length > 5) {
            helper.log("blue", "Removing empty folder " + folder);
            try {
                rimraf.sync(folder);
            } catch (e) {
                helper.log("red", "Could not remove " + folder + " : " + e.message);
            }
        }
    }
}

const moveToFailedDirectory = (filePath, file, directoryToParse, failedMatchDirectory, search) => {
    let message = "Moving " + file.base + " (" + file.parsed.title + ") - To failed matches folder";

    if (typeof search !== "undefined") {
        message +=  " (" + search.results.length + ") " + JSON.stringify(search.results[0]);
    } else {
        message += " - Could not match against tviso";
    }

    helper.log("red",  message);

    // dont move to failedMatchDirectory if it's already there
    if (directoryToParse != failedMatchDirectory) {
        fs.renameSync(filePath, path.join(failedMatchDirectory, file.base));
    }
}

const parseFiles = async (directoryToParse) => {
    let files = helper.getAllFiles(directoryToParse),
        hasMatched,
        file,
        media,
        search,
        folderName,
        fileName,
        folderPath,
        query,
        dbPath = path.join(conf.destinationDirectory, './medias.db');

    if (!fs.existsSync(dbPath)) {
        fs.copyFileSync('./medias.db', dbPath);
    }

    const db = await sqlite.open(dbPath, { Promise });

    for(let k in files) {
        file = path.parse(files[k]);

        // ignore non video extensions
        if (conf.extensionsToIgnore.indexOf(file.ext.substr(1)) !== -1) {
            helper.log("blue", "Skipping " + file.base + " - Not a media extension");

            // remove files to ignore
            helper.log("blue", "Removing " + file.base);
            try {
                fs.unlinkSync(files[k]);
            } catch (e) {
                helper.log("red", "Could not remove " + files[k] + " : " + e.message);
            }


            // if folder is now empty, just delete it
            if (path.parse(file.dir).name != path.parse(directoryToParse).name && helper.getAllFiles(file.dir).length == 0 && file.dir.length > 5) { // avoid removing c:\\
                helper.log("blue", "Removing empty folder " + file.dir);
                try {
                    rimraf.sync(file.dir);
                } catch (e) {
                    helper.log("red", "Could not remove " + file.dir + " : " + e.message);
                }
            }
            continue;
        }

        helper.log("normal", "Parsing " + file.base);

        file.parsed = ptn(file.name);

        if (file.parsed.title.length < 1) {
            helper.log("red", "Skipping " + file.name + " (ptn has failed parsing it)");
            continue;
        }

        file.parsed.title = file.parsed.title.trim();

        // if has season but not episode or the inverse thing, skip it, something is wrong
        if ((typeof file.parsed.episode === "number" && typeof file.parsed.season !== "number") || (typeof file.parsed.episode !== "number" && typeof file.parsed.season === "number")) {
            helper.log("red", "Skipping " + file.name + " (ptn has failed parsing it)");
            continue;
        }

        helper.log("normal", "Matching against Tviso " + file.parsed.title);
        search = await tviso.search(file.parsed.title);

        if (search.results.length < 1) {
            moveToFailedDirectory(files[k], file, directoryToParse, conf.failedMatchDirectory);
            continue;
        }

        hasMatched = false;

        for(let i in search.results) {
            media = search.results[i]

            if (!mediaMatches(media, file.parsed)) {
                continue;
            }

            hasMatched = true;
            helper.log("green", "Got a match: " +  file.parsed.title + " <--> " +  media.name + " - (" + media.idm + "-" + media.mediaType + ")");

            if (!isTvshow(media)) {
                query = await db.get("SELECT * FROM medias WHERE idm = ? AND mediaType = ?", media.idm, media.mediaType);

                if (typeof query !== "undefined") {
                    helper.log("red", "Skipping " + file.name + " (" + media.name + " - " + media.idm + " " + media.mediaType + ") - Media already present in db :S");
                    break;
                }
            }

            // try to set a readable folder name, on error set the existing one
            folderName = media.name.replace(invalidPathRegex, '').trim();

            if (isInvalidPath(folderName)) {
                folderName = file.name.replace(invalidPathRegex, '').trim();
            }

            // tvshow episodes share parent folder
            if ((!isTvshow(media) && fs.existsSync(path.join(conf.destinationDirectory, folderName))) || isInvalidPath(folderName)) {
                folderName = media.idm  + "-" + media.mediaType;
            }

            if (isTvshow(media)) {
                fileName = file.parsed.season + "x" + file.parsed.episode; // 1x01
            } else {
                fileName = folderName;
            }
            fileName += file.ext;

            if (isInvalidPath(fileName, {file: true})) {
                fileName = file.base; // set the original name
            }
            media.fileName = fileName;

            // comes from a folder, they may be .srt files or other important data that should also be moved
            if (file.dir != conf.directoryToParse) {
                // @ToDo scan folder looking for media related files
            }

            folderPath = path.join(conf.destinationDirectory, folderName);

            // folderPath may exists for tvshows, there is no need to redownload episode's parent media
            if (!fs.existsSync(folderPath)) {
                helper.log("blue", "Downloading tviso metadata");
                fs.mkdirSync(folderPath);

                await helper.downloadFile(media.artwork.backdrops.large, path.join(folderPath, "backdrop.jpg"));
                await helper.downloadFile(media.artwork.posters.large, path.join(folderPath, "poster.jpg"));

                fs.writeFileSync(path.join(folderPath, "media.json"), JSON.stringify(media));
            }

            // /Game Of Thrones/1/ for season one, etc..
            if (isTvshow(media)) {
                folderPath = path.join(folderPath, file.parsed.season.toString());

                 try {
                     fs.mkdirSync(folderPath);
                 } catch (e) {}
            }

            helper.log("blue", "Moving " + file.base + " to " + path.join(folderPath, fileName) + " (may take a while for larger ones)");

            // move the media file
            fs.renameSync(files[k], path.join(folderPath, fileName));

            helper.log("green", "Moved");

            try {
                query = await db.run("INSERT INTO medias (idm, mediaType, folderName, fileName, name, year, added, json) VALUES (:idm, :mediaType, :folderName, :fileName, :name, :year, :added, :json)", {
                    ':idm' : media.idm,
                    ':mediaType' : media.mediaType,
                    ':folderName' : folderName,
                    ':fileName' : fileName,
                    ':name' : media.name,
                    ':year' : media.year,
                    ':added' : new Date().getTime(),
                    ':json' : JSON.stringify(media)
                });
            } catch (e) {}
            break;
        }
        if (!hasMatched) {
            moveToFailedDirectory(files[k], file, directoryToParse, conf.failedMatchDirectory, search);
            continue;
        }
    }
}

const replaceWord = (directoryToParse, word, replacement) => {
    let files = helper.getAllFiles(directoryToParse),
        finalPath;

    for(let k in files) {
        file = path.parse(files[k]);

        if (file.name.indexOf(word) === -1) {
            continue;
        }
        file.base = file.base.replace(word, replacement);

        fs.renameSync(files[k], path.join(file.dir, file.base));

        helper.log("green", "Renamed " + file.name + " to " + file.base);
    }
}

const server = http.createServer(async (req, res) => {
  res.statusCode = 200;
  let parsedUrl = Url.parse(req.url, true);

  switch (parsedUrl.pathname.substr(1)) {
      case "retry-invalids":
      case "retry":
        reply(res, "working on that");
        await parseFiles(conf.failedMatchDirectory);
      break;
      case "parse":
        reply(res, "working on that");
        await parseFiles(conf.directoryToParse);
        await cleanFolder(conf.directoryToParse);
      break;
      case "replace":
        if (typeof parsedUrl.query.word === "undefined" || parsedUrl.query.word.length < 1) {
            return reply(res, "invalid word param");
        }
        if (typeof parsedUrl.query.replacement === "undefined") {
            return reply(res, "invalid word param");
        }

        if (typeof parsedUrl.query.replacement === "undefined" || parsedUrl.query.replacement.length < 1) {
            parsedUrl.query.replacement = "";
        }

        reply(res, "working on that");

        await replaceWord(conf.failedMatchDirectory, parsedUrl.query.word, parsedUrl.query.replacement);
      break;
  }
});
server.on('clientError', function(err, socket) {
  socket.destroy();
});
server.listen(conf.port, '127.0.0.1', () => {
  console.log(`Media identifier started on http://localhost:${conf.port}`);
});
