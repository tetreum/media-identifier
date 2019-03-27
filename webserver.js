const fs = require('fs');
const http = require('http');
const path = require('path');
const Url = require('url');
const AnsiConverter = require('ansi-to-html');

const conf = require('./conf');
const helper = require('./helper');
const mediaIdentifier = require('./media-identifier');
const Template = require('./template');

const reply = (res, rep, type = null) => {
	if (type === null) {
		type = typeof rep;
	}
    switch (type) {
		case "html":
		case "htm":
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(rep);
            break;
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

const renderHome = async (res) => {
	reply(res, Template.render("home"), "html");
}

const renderLog = (res) => {
	const logFile = helper.getLogPath();
	let text = "";

	if (fs.existsSync(logFile)) {
		text = fs.readFileSync(logFile, "utf8");
	}

	reply(res, (new AnsiConverter()).toHtml(text), "html");
}

const renderFailedMatches = async (res) => {
	let files = helper.getAllFiles(conf.failedMatchDirectory);
	let html = "";

	for(let k in files) {
		html += Template.render("failedMatch", path.parse(files[k]));
	}
	reply(res, html, "html");
}

const start = () => {
	const server = http.createServer(async (req, res) => {
	  res.statusCode = 200;
	  let parsedUrl = Url.parse(req.url, true);

	  switch (parsedUrl.pathname.substr(1)) {
		  case "":
		  	await renderHome(res);
		  break;
		  case "rename":
		  	//fs.renameSync(files[k], path.join(folderPath, fileName));
	        reply(res, "working on that");
	      break;
		  case "log":
		  	renderLog(res);
		  break;
		  case "failed-matches":
		  	renderFailedMatches(res);
		  break;
	      case "retry-invalids":
	      case "retry":
	        reply(res, "working on that");
	        await mediaIdentifier.parseDirectory(conf.failedMatchDirectory);
	      break;
	      case "parse":
	        reply(res, "working on that");
	        await mediaIdentifier.parseDirectory(conf.directoryToParse);
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

	        await mediaIdentifier.replaceWord(conf.failedMatchDirectory, parsedUrl.query.word, parsedUrl.query.replacement);
	      break;
	  }
	});
	server.on('clientError', function(err, socket) {
	  socket.destroy();
	});
	server.listen(conf.port, '127.0.0.1', () => {
	  console.log(`Media identifier started on http://localhost:${conf.port}`);
	});

	return server;
}

module.exports = {
	start
}
