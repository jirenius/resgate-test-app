// Create a require context of all js-files that has the same case-insensitive name as its parent folder
const req = require.context("./module/", true, /^.*\/([^/]*)\/\1.js$/i);

let modules = {};
// Using the first-character-lowercase name of the js-file as module name
req.keys().forEach(key => {
	let match = key.match(/\/([^/]*)\.js$/);
	let name = match[1].charAt(0).toLowerCase() + match[1].slice(1);
	if (modules[name]) {
		throw new Error(`Duplicate module: ${key}`);
	}
	modules[name] = req(key).default;
});

export default modules;
