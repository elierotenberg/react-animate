'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _get = require('babel-runtime/helpers/get')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _defineProperty = require('babel-runtime/helpers/define-property')['default'];

var _toConsumableArray = require('babel-runtime/helpers/to-consumable-array')['default'];

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _Symbol = require('babel-runtime/core-js/symbol')['default'];

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

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
  // for each 'transform' property, set/prepend 'translateZ(0)'
  _.each(transformProperties, function (property) {
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

var Animate = {
  '@animations': _Symbol('animations'),

  '@abortAnimation': _Symbol('abortAnimation'),

  '@animate': _Symbol('animate'),

  '@getAnimatedStyle': _Symbol('getAnimatedStyle'),

  '@isAnimated': _Symbol('isAnimated'),

  animate: function animate() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (__DEV__) {
      this.should.not.be.exactly(Animate);
    }
    return this[Animate['@animate']].apply(this, args);
  },

  abortAnimation: function abortAnimation() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    if (__DEV__) {
      this.should.not.be.exactly(Animate);
    }
    return this[Animate['@abortAnimation']].apply(this, args);
  },

  getAnimatedStyle: function getAnimatedStyle() {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    if (__DEV__) {
      this.should.not.be.exactly(Animate);
    }
    return this[Animate['@getAnimatedStyle']].apply(this, args);
  },

  isAnimated: function isAnimated() {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    if (__DEV__) {
      this.should.not.be.exactly(Animate);
    }
    return this[Animate['@isAnimated']].apply(this, args);
  },

  DEFAULT_EASING: 'cubic-in-out',

  extend: null };

function animatedStyleStateKey(name) {
  return 'Animate@' + name;
}

Animate.extend = function (Component) {
  return (function (_Component) {
    var _class = function (props) {
      _classCallCheck(this, _class);

      _get(Object.getPrototypeOf(_class.prototype), 'constructor', this).call(this, props);
      if (!_.isObject(this.state)) {
        this.state = {};
      }
      this[Animate['@animations']] = {};
    };

    _inherits(_class, _Component);

    _createClass(_class, [{
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        var _this5 = this;

        if (_get(Object.getPrototypeOf(_class.prototype), 'componentWillUnmount', this)) {
          _get(Object.getPrototypeOf(_class.prototype), 'componentWillUnmount', this).call(this);
        }
        if (this[Animate['@animations']] !== null) {
          _.each(this[Animate['@animations']], function (animation, name) {
            return Animate.abortAnimation.call(_this5, name, animation);
          });
        }
      }
    }, {
      key: Animate['@getAnimatedStyle'],
      value: function (name) {
        if (__DEV__) {
          name.should.be.a.String;
        }
        return this.state && this.state[animatedStyleStateKey(name)] || {};
      }
    }, {
      key: Animate['@isAnimated'],
      value: function (name) {
        if (__DEV__) {
          name.should.be.a.String;
        }
        return this[Animate['@animations']][name] !== void 0;
      }
    }, {
      key: Animate['@abortAnimation'],
      value: function (name) {
        if (__DEV__) {
          name.should.be.a.String;
        }
        if (this[Animate['@animations']][name] !== void 0) {
          var _Animate$Animations$name = this[Animate['@animations']][name];
          var easingFn = _Animate$Animations$name.easingFn;
          var onAbort = _Animate$Animations$name.onAbort;
          var nextTick = _Animate$Animations$name.nextTick;
          var t = _Animate$Animations$name.t;
          var currentStyle = _Animate$Animations$name.currentStyle;

          _raf2['default'].cancel(nextTick);
          onAbort(currentStyle, t, easingFn(t));
          // unregister the animation
          delete this[Animate['@animations']][name];
          return true;
        }
        // silently fail but returns false
        return false;
      }
    }, {
      key: Animate['@animate'],
      value: function (name, fromStyle, toStyle, duration) {
        var _this6 = this;

        var opts = arguments[4] === undefined ? {} : arguments[4];
        var _opts$easing = opts.easing;
        var easing = _opts$easing === undefined ? Animate.DEFAULT_EASING : _opts$easing;
        var _opts$onTick = opts.onTick;
        var onTick = _opts$onTick === undefined ? function () {
          return void 0;
        } : _opts$onTick;
        var _opts$onAbort = opts.onAbort;
        var onAbort = _opts$onAbort === undefined ? function () {
          return void 0;
        } : _opts$onAbort;
        var _opts$onComplete = opts.onComplete;
        var onComplete = _opts$onComplete === undefined ? function () {
          return void 0;
        } : _opts$onComplete;
        var _opts$disableMobileHA = opts.disableMobileHA;
        var disableMobileHA = _opts$disableMobileHA === undefined ? false : _opts$disableMobileHA;

        if (__DEV__) {
          name.should.be.a.String;
          fromStyle.should.be.an.Object;
          toStyle.should.be.an.Object;
          duration.should.be.a.Number.which.is.above(0);
          onTick.should.be.a.Function;
          onAbort.should.be.a.Function;
          onComplete.should.be.a.Function;
        }
        // if there is already an animation with this name, abort it
        if (this[Animate['@animations']][name] !== void 0) {
          Animate.abortAnimation.call(this, name);
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
        // pre-compute the final style (ignore [from])
        var finalStyle = _.mapValues(styles, function (_ref3) {
          var _ref32 = _slicedToArray(_ref3, 2);

          var to = _ref32[1];
          return to;
        });

        // do the hardware acceleration trick
        if (!disableMobileHA && shouldEnableHA()) {
          enableHA(transformProperties, styles);
        }

        var start = Date.now();
        var stateKey = animatedStyleStateKey(name);

        // the main ticker function
        var tick = function tick() {
          var now = Date.now();
          // progress: starts at 0, ends at > 1
          var t = (now - start) / duration;
          // we are past the end
          if (t > 1) {
            _this6.setState(_defineProperty({}, stateKey, finalStyle));
            onTick(finalStyle, 1, easingFn(1));
            onComplete(finalStyle, t, easingFn(t));
            // unregister the animation
            delete _this6[Animate['@animations']][name];
            return;
            // the animation is not over yet
          }
          var currentStyle = _.mapValues(interpolators, function (fn) {
            return fn(easingFn(t));
          });
          _this6.setState(_defineProperty({}, stateKey, currentStyle));
          onTick(currentStyle, t, easingFn(t));
          _Object$assign(_this6[Animate['@animations']][name], { nextTick: _raf2['default'](tick), t: t, currentStyle: currentStyle });
        };

        // register the animation
        this[Animate['@animations']][name] = {
          easingFn: easingFn,
          onAbort: onAbort,
          nextTick: _raf2['default'](tick),
          t: 0,
          currentStyle: fromStyle };
        return this;
      }
    }]);

    return _class;
  })(Component);
};

exports['default'] = Animate;
module.exports = exports['default'];