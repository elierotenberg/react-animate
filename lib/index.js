import 'babel-polyfill';
import Promise from 'bluebird';
import interpolate from 'd3-interpolate';
import ease from 'd3-ease';
const __DEV__ = process && process.env && process.env.NODE_ENV === 'development';
Promise.config({
  warnings: __DEV__,
  longStackTraces: __DEV__,
  cancellation: true,
});
const __BROWSER__ = (typeof window === 'object');
