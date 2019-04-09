const chokidar = require('chokidar');

const mediaIdentifier = require('./media-identifier');
const webserver = require('./webserver');
const conf = require('./conf');

process.on('unhandledRejection', e => {
  console.log('UnhandledRejection: ', e.message, e);
});

webserver.start();

chokidar.watch(conf.directoryToParse, {
	ignored: /(^|[\/\\])\../,
	awaitWriteFinish: {
      stabilityThreshold: 1000 * 60 * 5
    },
	ignoreInitial: true
}).on('add', async (path) => {
    console.log("New file detected " + path);
    await mediaIdentifier.parseFiles(conf.directoryToParse, [path]);
}).on('ready', () => {
  console.log("Listening to " + conf.directoryToParse + " directory changes");
});
