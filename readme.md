![Preview](https://raw.githubusercontent.com/tetreum/media-identifier/master/preview/preview.gif)

Small panel to fix failed matches/watch the logs:
![Preview](https://raw.githubusercontent.com/tetreum/media-identifier/master/preview/panel.png)

# Media identifier

Matches your movies/tvshows files against Tviso API and downloads their metadata+images+places them in a human readable format (plex like division between movies and series).

# Example

Having the following structure:
```bash
c:\completed_downloads
- The Walking Dead S05E03 720p HDTV x264-ASAP[ettv].mkv
- Hercules (2014) 1080p BrRip H264 - YIFY.avi
- Visit my website click here!!.url
- D4wn.0f.th3.Pl4n3t.0f.th3.4p3s.2014.HDRip.XViD-EVO.mp4
- SUPER IMPORTANT, README.txt
```

After running `media-identifier` will result in:

```bash
c:\completed_downloads
c:\collection
- media.db (sqlite db containing the list of all medias present in the folder)
- \series\Walking Dead\media.json (tvshow metadata like, name, year, actors, etc..)
- \series\Walking Dead\poster.jpg
- \series\Walking Dead\backdrop.jpg
- \series\Walking Dead\5\5x03.mkv
- \movies\Hercules\media.json (movie metadata like, name, year, actors, etc..)
- \movies\Hercules\poster.jpg
- \movies\Hercules\backdrop.jpg
- \movies\Hercules\Hercules.avi
c:\failed_match
- D4wn.0f.th3.Pl4n3t.0f.th3.4p3s.2014.HDRip.XViD-EVO.mp4
```


# Requirements
1. node >= v8
2. Tviso API app (https://developers.tviso.com/)

# Setup

0. Change your torrent downloader behaviour to move the finished downloads to a separate folder. So `media-identifier` won't move/work with unfinished downloads
1. `git clone https://github.com/tetreum/media-identifier.git` or download the zip
2. `npm install`
3. `mv conf.demo.js conf.js`
4. Modify conf.js data
5. `node index.js` (if i were you i would point its output somewhere as it maybe useful)

# Usage

Media identifier will automatically detect new files added to `directoryToParse` and will attempt to match them against tviso.
- Matched content will be moved to `destinationDirectory` you set on `conf.js`
- If it fails to match any content, it will be moved to `failedMatchDirectory` folder, so you can rename the file for better matching & it's not checked on each `/parse` call
- To fix failed matches/view logs `http://localhost:3000/`
- To force a match, rename the file to its media `mediaType-idm`. Example: 2-2622.avi => Die Hard


# API Methods

(ex: `http://localhost:3000/parse`)

- `/parse`: Processes completed downloads folder (`directoryToParse`)
- `/retry`: Reprocesses failed matches (`failedMatchDirectory`)
- `/replace`: Replaces a `word` with the given `replacement` over all file names in failed matches directory (so you can faster remove domains and other junk from their name)
