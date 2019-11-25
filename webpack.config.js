'use strict';
var path = require('path');
var webpack = require("webpack");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var fs = require('fs');

var includePaths = [
	fs.realpathSync(__dirname + '/src')
];

var moduleConfigPath = path.join(__dirname, 'src/module.config.local.js');
if (!fs.existsSync(moduleConfigPath)) {
	moduleConfigPath = path.join(__dirname, 'src/module.config.js');
}
var alias = {
	'module.config': moduleConfigPath
};
var aliasPath = path.join(__dirname, 'webpack.alias.js');
if (fs.existsSync(aliasPath)) {
	let aliasFile = require(aliasPath);
	for (var mod in aliasFile) {
		alias[mod] = path.resolve(__dirname, aliasFile[mod]);
	}
}

module.exports = {
	mode: 'development',
	devtool: 'eval-source-map',
	entry: {
		app: path.join(__dirname, 'src/main.js')
	},
	output: {
		path: path.join(__dirname, '/build/'),
		filename: '[name].js'
	},
	resolve: {
		alias: alias,
		modules: [
			'node_modules',
			path.resolve('./src')
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'src/index.html',
			inject: 'body',
			filename: 'index.html'
		}),
		new webpack.LoaderOptionsPlugin({
			options: {
				eslint: {
					configFile: './.eslintrc'
				}
			}
		})
	],
	module: {
		rules: [
			{
				test: /\.mjs$/,
				include: /node_modules/,
				type: 'javascript/auto'
			},
			{
				test: /\.(js)$/,
				include: includePaths,
				enforce: 'pre',
				loader: 'eslint-loader',
				options: {
					emitWarning: true
				}
			},
			{
				test: /\.(js)$/,
				exclude: /node_modules/,
				use: 'babel-loader'
			},
			{
				test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
				use: {
					loader: 'file-loader',
					options: {
						name: '[path][name].[ext]'
					}
				}
			},
			{
				test: /\.(sa|sc|c)ss$/,
				use: [
					'style-loader',
					'css-loader?sourceMap=true'
				]
			}
		]
	}
};
