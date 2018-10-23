# Media identifier

Matches your movies/tvshows files against Tviso API and downloads their metadata+images+places them in a human readable format.

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
- \Walking Dead\media.json (tvshow metadata like, name, year, actors, etc..)
- \Walking Dead\poster.jpg
- \Walking Dead\backdrop.jpg
- \Walking Dead\5\5x03.mkv
- \Hercules\media.json (movie metadata like, name, year, actors, etc..)
- \Hercules\poster.jpg
- \Hercules\backdrop.jpg
- \Hercules\Hercules.avi
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

To parse your downloads, head to `http://localhost:3000/parse`.
- Matched content will be moved to the folder you set on `conf.js`
- If it fails to match any content, it will be moved to a different folder, so you can rename the file for better matching & it's not checked on each `/parse` call
- To retry failed matches folder just call `http://localhost:3000/retry-invalids`
