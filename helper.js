const fs = require('fs');
const path = require('path');
const https = require('https');
const clc = require("cli-color");

/**
 * Find all files inside a dir, recursively.
 * @function getAllFiles
 * @param  {string} dir Dir path string.
 * @return {string[]} Array with all file names that are inside the directory.
 */
const getAllFiles = dir =>
  fs.readdirSync(dir).reduce((files, file) => {
    const name = path.join(dir, file);
    const isDirectory = fs.statSync(name).isDirectory();
    return isDirectory ? [...files, ...getAllFiles(name)] : [...files, name];
  }, []);

 const getAllFolders = dir =>
    fs.readdirSync(dir).reduce((files, file) => {
      const name = path.join(dir, file);
      const isDirectory = fs.statSync(name).isDirectory();

      if (isDirectory) {
          return [...files, name, ...getAllFiles(name)]
      }
    }, []);

 const downloadFile = (url, destination) => {
    return new Promise((resolve, reject) => {
        var file = fs.createWriteStream(destination);
        var request = https.get(url, (res) => {
          res.pipe(file);
          res.on('end', resolve);
        });
    });
 };

 const log = (color, message) => {
     let d = new Date();

     message = "[" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "] " + message;

     if (color === "blue") { // i cant see the f** blue in black screens
         color = "cyan";
     }
     if (color !== "normal") {
        message = clc[color](message);
     }
     console.log(message);
 }

module.exports = {
    log,
    getAllFiles,
    getAllFolders,
    downloadFile
}
