module.exports = {
    "themoviedb": { // from https://www.themoviedb.org/settings/api/new
        "key": "204cae4y56y565uu3e16a746",
        "mainLanguage": "es-ES", // it will search titles on that language and if has no matches, will retry with fallback
        "fallbackLanguage": "en-US",
    },
    directoryToParse: "E:\\completed_torrent_downloads", // where your torrent downloader leaves the files
    destinationDirectory: "E:\\collection", // Where your perfect media collection will rest
    failedMatchDirectory: "E:\\failed_matches", // torrent files that could not be matched against a movie/show, will be moved here for manual match
    extensionsToIgnore: ["txt", "nfo", "lnk", "url", "md", 'db', "json", "parts"], // they will be deleted
    port: 3000
}
