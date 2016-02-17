// eslint-disable

var path = require('path');
var karmaWebpack = require('karma-webpack');

var webpackConfig = require('../../webpack/dev');

var root = path.join(
  __dirname, // /config/gulp/tasks
  '..', // /config/gulp
  '..', // /config/
  '..', // /
);

var dist = path.join(root, 'dist', 'browser', 'dev', 'lib');
var specs = path.join(dist, '**/__specs__/**/*.js');

module.exports = function(config) {
  var preprocessors = {};
  preprocessors[specs] = ['webpack'];
  config.set({
    frameworks: ['mocha', 'sinon-chai'],
    files: [
      specs,
    ],
    preprocessors: preprocessors,
    plugins: [
      karmaWebpack,
    ],
    webpack: webpackConfig,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: false,
    browsers: ['Chrome', 'Firefox', 'IE'],
    client: {
      mocha: {
        ui: 'bdd',
      },
    },
    singleRun: true,
    concurrency: Infinity,
  });
};
