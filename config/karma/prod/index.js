import path from 'path';
import karmaWebpack from 'karma-webpack';

import webpackConfig from '../../webpack/prod';

const root = path.join(
  __dirname, // /config/gulp/tasks
  '..', // /config/gulp
  '..', // /config/
  '..', // /
);

const dist = path.join(root, 'dist', 'browser', 'prod', 'lib');
const specs = path.join(dist, '**/__specs__/**/*.js');

export default (config) => {
  config.set({
    frameworks: ['mocha', 'sinon-chai'],
    files: [
      specs,
    ],
    preprocessors: {
      [specs]: ['webpack'],
    },
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
