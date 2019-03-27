const fs = require('fs');
const handlebars = require('handlebars');

let renderedTemplates = {};

const render = (file, vars = {}) => {
	if (typeof renderedTemplates[file] === 'undefined') {
		renderedTemplates[file] = handlebars.compile(fs.readFileSync("./templates/" + file + ".htm", 'utf-8'))
	}

	return renderedTemplates[file](vars);
}

module.exports = {
  render
}
