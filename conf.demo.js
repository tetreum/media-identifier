module.exports = {
    "tviso": { // from http://developers.tviso.com
        "app" : 36201,
        "secret" : "64BSYBIUHFDNdsgbeyr",
    },
    directoryToParse: "E:\\completed_torrent_downloads", // where your torrent downloader leaves the files
    destinationDirectory: "E:\\collection", // Where your perfect medias collection will rest
    failedMatchDirectory: "E:\\failed_matches", // torrent files that could not be matched against a movie/show, will be moved here for manual match
    extensionsToIgnore: ["txt", "nfo", "lnk", "url", "md", 'db', "json", "parts"], // they will be deleted
    port: 3000
}
