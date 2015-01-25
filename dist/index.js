"use strict";

var _slicedToArray = function (arr, i) {
  if (Array.isArray(arr)) {
    return arr;
  } else {
    var _arr = [];

    for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
      _arr.push(_step.value);

      if (i && _arr.length === i) break;
    }

    return _arr;
  }
};

var _defineProperty = function (obj, key, value) {
  return Object.defineProperty(obj, key, {
    value: value,
    enumerable: true,
    configurable: true,
    writable: true
  });
};

var _toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

var _interopRequire = function (obj) {
  return obj && (obj["default"] || obj);
};

require("6to5/polyfill");
var _ = require("lodash");
var should = require("should");
var Promise = (global || window).Promise = require("bluebird");
var __DEV__ = process.env.NODE_ENV !== "production";
var __PROD__ = !__DEV__;
var __BROWSER__ = typeof window === "object";
var __NODE__ = !__BROWSER__;
if (__DEV__) {
  Promise.longStackTraces();
  Error.stackTraceLimit = Infinity;
}
var raf = _interopRequire(require("raf"));

var tween = _interopRequire(require("tween-interpolate"));

// To avoid collisions with other mixins,
// wrap private properties in this method.
// It doesn't implement any actual protection
// mechanisms but merely avoids mistakes/conflicts.
function privateSymbol(property) {
  return "__animateMixin" + property;
}

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
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) && /Android 2\.3\.[3-7]/i.test(userAgent);
}

var _animations = privateSymbol("animations");

var DEFAULT_EASING = "cubic-in-out";

// Hardware acceleration trick constants
var transformProperties = ["WebkitTransform", "MozTransform", "MSTransform", "OTransform", "Transform"];
var transformHA = "translateZ(0)";

module.exports = (function () {
  var _module$exports = {};

  _defineProperty(_module$exports, _animations, null);

  _defineProperty(_module$exports, "componentWillMount", function componentWillMount() {
    this[_animations] = {}; // initialize the property to no animations
  });

  _defineProperty(_module$exports, "componentWillUnmount", function componentWillUnmount() {
    var _this = this;
    if (this[_animations] !== null) {
      // abort any currently running animation
      _.each(this[_animations], function (animation, name) {
        return _this.abortAnimation(name);
      });
    }
  });

  _defineProperty(_module$exports, "getAnimatedStyle", function getAnimatedStyle(name) {
    if (__DEV__) {
      // typecheck parameters in dev mode
      name.should.be.a.String;
    }
    if (this[_animations][name] !== void 0) {
      return this[_animations][name].currentStyle;
    }
    return {}; // silently fail if there is no such animation
  });

  _defineProperty(_module$exports, "abortAnimation", function abortAnimation(name) {
    if (__DEV__) {
      // typecheck parameters in dev mode
      name.should.be.a.String;
    }
    if (this[_animations][name] !== void 0) {
      var easingFn = this[_animations][name].easingFn;
      var onAbort = this[_animations][name].onAbort;
      var nextTick = this[_animations][name].nextTick;
      var t = this[_animations][name].t;
      var currentStyle = this[_animations][name].currentStyle;
      raf.cancel(nextTick);
      onAbort(currentStyle, t, easingFn(t));
      delete this[_animations][name]; // unregister the animation
      return true;
    }
    return false; // silently fail but returns false
  });

  _defineProperty(_module$exports, "animate", function animate(name, fromStyle, toStyle, duration) {
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
      duration.should.be.a.Number.which.is.not.above(0);
      onTick.should.be.a.Function;
      onAbort.should.be.a.Function;
      onComplete.should.be.a.Function;
    }
    if (this[_animations][name] !== void 0) {
      // if there is already an animation with this name, abort it
      this.abortAnimation(name);
    }
    // create the actual easing function using tween-interpolate (d3 smash)
    var easingFn = _.isObject(easing) ? tween.ease.apply(tween, [easing.type].concat(_toArray(easing.arguments))) : tween.ease(easing);
    // reformat the input: [property]: [from, to]
    var styles = {};
    _.each(fromStyle, function (value, property) {
      return styles[property] = [value, value];
    }); // unless told otherwise below, the value is assumed constant
    // if we dont have an initial value for each property, assume it is constant from the beginning
    _.each(toStyle, function (value, property) {
      return styles[property] = styles[property] === void 0 ? [value, value] : [styles[property][0], value];
    });
    var interpolators = _.mapValues(styles, function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var from = _ref2[0];
      var to = _ref2[1];
      return tween.interpolate(from, to);
    }); // get an interpolator for each property
    var finalStyle = _.mapValues(styles, function (_ref3) {
      var _ref32 = _slicedToArray(_ref3, 2);

      var from = _ref32[0];
      var to = _ref32[1];
      return to;
    }); // pre-compute the final style

    if (!disableMobileHA && shouldEnableHA()) {
      // do the hardware acceleration trick
      _.each(transformProperties, function (property) {
        // for each 'transform' property, set/prepend 'translateZ(0)'
        if (styles[property] === void 0) {
          styles[property] = [transformHA, transformHA];
        } else {
          var _styles$property = _slicedToArray(styles[property], 2);

          var from = _styles$property[0];
          var to = _styles$property[1];
          styles[property] = ["" + transformHA + " " + from, "" + transformHA + " " + to];
        }
      });
    }

    var start = Date.now();
    var stateKey = privateSymbol("animation" + name);

    var tick = function () {
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
      Object.assign(_this2[_animations][name], { nextTick: raf(tick), t: t, currentStyle: currentStyle });
    };

    // register the animation
    this[_animations][name] = { easingFn: easingFn, onAbort: onAbort, nextTick: raf(tick), t: 0, currentStyle: fromStyle };
    return this;
  });

  return _module$exports;
})();
// prepare the property to avoid reshapes