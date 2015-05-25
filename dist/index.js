'use strict';

var _toConsumableArray = require('babel-runtime/helpers/to-consumable-array')['default'];

var _defineProperty = require('babel-runtime/helpers/define-property')['default'];

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var _Mixin;

var _raf = require('raf');

var _raf2 = _interopRequireDefault(_raf);

var _tweenInterpolate = require('tween-interpolate');

var _tweenInterpolate2 = _interopRequireDefault(_tweenInterpolate);

var _ = require('lodash');
var should = require('should');
var Promise = (global || window).Promise = require('bluebird');
var __DEV__ = process.env.NODE_ENV !== 'production';
var __PROD__ = !__DEV__;
var __BROWSER__ = typeof window === 'object';
var __NODE__ = !__BROWSER__;
if (__DEV__) {
  Promise.longStackTraces();
  Error.stackTraceLimit = Infinity;
}

// To avoid collisions with other mixins,
// wrap private properties in this method.
// It doesn't implement any actual protection
// mechanisms but merely avoids mistakes/conflicts.
function privateSymbol(property) {
  return '__animateMixin' + property;
}

function isMobile(userAgent) {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

function isGingerbread(userAgent) {
  return /Android 2\.3\.[3-7]/i.test(userAgent);
}

// Hardware acceleration trick constants
var transformProperties = ['WebkitTransform', 'MozTransform', 'MSTransform', 'OTransform', 'Transform'];
var transformHA = 'translateZ(0)';

// Decide whether we should do the hardware accelaration trick
// if we are not explicitly prevented from.
// The trick will be enabled in mobile browsers which are not
// Android Gingerbread.
function shouldEnableHA() {
  if (!__BROWSER__) {
    return false;
  }
  var userAgent = navigator.userAgent;

  if (!userAgent) {
    return false;
  }
  // is mobile but not gingerbread
  return isMobile(userAgent) && !isGingerbread(userAgent);
}

function enableHA(styles) {
  _.each(transformProperties, function (property) {
    // for each 'transform' property, set/prepend 'translateZ(0)'
    if (styles[property] === void 0) {
      styles[property] = [transformHA, transformHA];
    } else {
      var _styles$property = _slicedToArray(styles[property], 2);

      var from = _styles$property[0];
      var to = _styles$property[1];

      styles[property] = ['' + transformHA + ' ' + from, '' + transformHA + ' ' + to];
    }
  });
}

var _animations = privateSymbol('animations');
var DEFAULT_EASING = 'cubic-in-out';

var Mixin = (_Mixin = {}, _defineProperty(_Mixin, _animations, null), _defineProperty(_Mixin, 'componentWillMount', function componentWillMount() {
  this[_animations] = {}; // initialize the property to no animations
}), _defineProperty(_Mixin, 'componentWillUnmount', function componentWillUnmount() {
  var _this = this;

  if (this[_animations] !== null) {
    // abort any currently running animation
    _.each(this[_animations], function (animation, name) {
      return _this.abortAnimation(name, animation);
    });
  }
}), _defineProperty(_Mixin, 'getAnimatedStyle', function getAnimatedStyle(name) {
  if (__DEV__) {
    // typecheck parameters in dev mode
    name.should.be.a.String;
  }
  return this.state && this.state[privateSymbol('animation' + name)] || {};
}), _defineProperty(_Mixin, 'isAnimated', function isAnimated(name) {
  if (__DEV__) {
    // typecheck parameters in dev mode
    name.should.be.a.String;
  }
  return this[_animations][name] !== void 0;
}), _defineProperty(_Mixin, 'abortAnimation', function abortAnimation(name) {
  if (__DEV__) {
    // typecheck parameters in dev mode
    name.should.be.a.String;
  }
  if (this[_animations][name] !== void 0) {
    var _animations$name = this[_animations][name];
    var easingFn = _animations$name.easingFn;
    var onAbort = _animations$name.onAbort;
    var nextTick = _animations$name.nextTick;
    var t = _animations$name.t;
    var currentStyle = _animations$name.currentStyle;

    _raf2['default'].cancel(nextTick);
    onAbort(currentStyle, t, easingFn(t));
    delete this[_animations][name]; // unregister the animation
    return true;
  }
  return false; // silently fail but returns false
}), _defineProperty(_Mixin, 'animate', function animate(name, fromStyle, toStyle, duration) {
  var _this2 = this;

  var opts = arguments[4] === undefined ? {} : arguments[4];

  var easing = opts.easing === void 0 ? DEFAULT_EASING : opts.easing;
  var onTick = opts.onTick || _.noop;
  var onAbort = opts.onAbort || _.noop;
  var onComplete = opts.onComplete || _.noop;
  var disableMobileHA = !!opts.disableMobileHA;
  if (__DEV__) {
    // typecheck parameters in dev mode
    name.should.be.a.String;
    fromStyle.should.be.an.Object;
    toStyle.should.be.an.Object;
    duration.should.be.a.Number.which.is.above(0);
    onTick.should.be.a.Function;
    onAbort.should.be.a.Function;
    onComplete.should.be.a.Function;
  }
  if (this[_animations][name] !== void 0) {
    // if there is already an animation with this name, abort it
    this.abortAnimation(name);
  }
  // create the actual easing function using tween-interpolate (d3 smash)
  var easingFn = _.isObject(easing) ? _tweenInterpolate2['default'].ease.apply(_tweenInterpolate2['default'], [easing.type].concat(_toConsumableArray(easing.arguments))) : _tweenInterpolate2['default'].ease(easing);
  // reformat the input: [property]: [from, to]
  var styles = {};
  // unless told otherwise below, the value is assumed constant
  _.each(fromStyle, function (value, property) {
    return styles[property] = [value, value];
  });
  // if we dont have an initial value for each property, assume it is constant from the beginning
  _.each(toStyle, function (value, property) {
    return styles[property] = styles[property] === void 0 ? [value, value] : [styles[property][0], value];
  });
  // get an interpolator for each property
  var interpolators = _.mapValues(styles, function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var from = _ref2[0];
    var to = _ref2[1];
    return _tweenInterpolate2['default'].interpolate(from, to);
  });
  // pre-compute the final style
  var finalStyle = _.mapValues(styles, function (_ref3) {
    var _ref32 = _slicedToArray(_ref3, 2);

    var from = _ref32[0];
    var to = _ref32[1];
    void from;return to;
  });

  if (!disableMobileHA && shouldEnableHA()) {
    // do the hardware acceleration trick
    enableHA(transformProperties, styles);
  }

  var start = Date.now();
  var stateKey = privateSymbol('animation' + name);

  var tick = function tick() {
    // the main ticker function
    var now = Date.now();
    var t = (now - start) / duration; // progress: starts at 0, ends at > 1
    if (t > 1) {
      // we are past the end
      _this2.setState(_defineProperty({}, stateKey, finalStyle));
      onTick(finalStyle, 1, easingFn(1));
      onComplete(finalStyle, t, easingFn(t));
      delete _this2[_animations][name]; // unregister the animation
      return;
    } // the animation is not over yet
    var currentStyle = _.mapValues(interpolators, function (fn) {
      return fn(easingFn(t));
    });
    _this2.setState(_defineProperty({}, stateKey, currentStyle));
    onTick(currentStyle, t, easingFn(t));
    _Object$assign(_this2[_animations][name], { nextTick: (0, _raf2['default'])(tick), t: t, currentStyle: currentStyle });
  };

  // register the animation
  this[_animations][name] = { easingFn: easingFn, onAbort: onAbort, nextTick: (0, _raf2['default'])(tick), t: 0, currentStyle: fromStyle };
  return this;
}), _Mixin);

exports['default'] = Mixin;
module.exports = exports['default'];
// prepare the property to avoid reshapes