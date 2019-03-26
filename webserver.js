const http = require('http');
const Url = require('url');

const conf = require('./conf');
const mediaIdentifier = require('./media-identifier');

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

const renderHome = (res) => {
	let html;
/*
	html = "<html><h2>Media identifier</h2>" +
	<ul>
		<li><a href="/failed">Failed matches</a></li>
		<li><a href="/log">Log</a></li>
	</ul>
	"</html>";*/

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.end(html);
}

const start = () => {
	const server = http.createServer(async (req, res) => {
	  res.statusCode = 200;
	  let parsedUrl = Url.parse(req.url, true);

	  switch (parsedUrl.pathname.substr(1)) {
		  case "":
		  	renderHome(res);
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
