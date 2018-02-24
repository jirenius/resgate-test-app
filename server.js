var path = require('path');
var express = require('express');
var webpack = require('webpack');
var webpackMiddleware = require('webpack-dev-middleware');
var webpackConfig = require('./webpack.config.js');

var app = express();

const port = 8000;

var compiler = webpack(webpackConfig);
var middleware = webpackMiddleware(compiler, {
	publicPath: webpackConfig.output.publicPath,
	contentBase: 'src',
	stats: {
		colors: true,
		hash: false,
		timings: true,
		chunks: false,
		chunkModules: false,
		modules: false
	}
});

app.use(middleware);
app.get('*', function response(req, res) {
	console.log("GET: ", req.url);
	var file = path.join(__dirname, 'build/index.html');
	res.write(middleware.fileSystem.readFileSync(file));
	res.end();
});

// Load all microservices
var normalizedPath = require("path").join(__dirname, "microservice");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
	console.info('Loading service ' + file);
	require("./microservice/" + file);
});

app.listen(port, '0.0.0.0', function onStart(err) {
	if (err) {
		console.log(err);
	}
	console.info('Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.', port, port);
});


