import gulp from 'gulp';
import karma from 'karma';
import path from 'path';

import karmaConfig from '../../karma';

function createSpec(env) {
  return (fn) => new karma.Server({
    configFile: path.join(__dirname, '..', '..', 'karma', env, 'index.js'),
    singleRun: true,
  }, fn).start();
}

export default () => {
  gulp.task('spec', Object.keys(karmaConfig).map((env) => {
    const specTaskName = `spec-${env}`;
    gulp.task(specTaskName, [`test-browser-${env}`], createSpec(env));
    return specTaskName;
  }));
};
