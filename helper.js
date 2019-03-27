const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const clc = require("cli-color");

let logStream = null;

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

  const getAllFolders = dir => {
    let folders = [];
    fs.readdirSync(dir).forEach((file) => {
      const name = path.join(dir, file);
      const isDirectory = fs.statSync(name).isDirectory();

      if (!isDirectory) {
        return;
      }
      folders.push(name, ...getAllFolders(name));
    });
      return folders;
  }

 const downloadFile = (url, destination) => {
    return new Promise((resolve, reject) => {
        var file = fs.createWriteStream(destination);
        var request = https.get(url, (res) => {
          res.pipe(file);
          res.on('end', resolve);
        });
    });
 };

 const getLogPath = () => {
	return path.join(os.tmpdir() , "media_identifier_output.log");
}

 const log = (color, message) => {

	 if (logStream === null) {
		logStream = fs.createWriteStream(getLogPath(), {flags:'a'});
	 }

     let d = new Date();

     message = "[" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "] " + message;

     if (color === "blue") { // i cant see the f** blue in black screens
         color = "cyan";
     }
     if (color !== "normal") {
        message = clc[color](message);
     }
     console.log(message);
	 logStream.write(message + os.EOL);
	 // stream.end();
 }

module.exports = {
    log,
	getLogPath,
    getAllFiles,
    getAllFolders,
    downloadFile
}
