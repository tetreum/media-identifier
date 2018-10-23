# Media identifier

Matches your movies/tvshows files against Tviso API and downloads their metadata+images+places them in a human readable format.

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

To parse your downloads, head to `http://localhost:3000/parse`.
- Matched content will be moved to the folder you set on `conf.js`
- If it fails to match any content, it will be moved to a different folder, so you can rename the file for better matching & it's not checked on each `/parse` call
- To retry failed matches folder just call `http://localhost:3000/retry-invalids`
