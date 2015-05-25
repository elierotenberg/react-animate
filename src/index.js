import raf from 'raf';
import tween from 'tween-interpolate';

// To avoid collisions with other mixins,
// wrap private properties in this method.
// It doesn't implement any actual protection
// mechanisms but merely avoids mistakes/conflicts.
function privateSymbol(property) {
  return `__animateMixin${property}`;
}

function isMobile(userAgent) {
  return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i).test(userAgent);
}

function isGingerbread(userAgent) {
  return (/Android 2\.3\.[3-7]/i).test(userAgent);
}

// Hardware acceleration trick constants
const transformProperties = ['WebkitTransform', 'MozTransform', 'MSTransform', 'OTransform', 'Transform'];
const transformHA = 'translateZ(0)';

// Decide whether we should do the hardware accelaration trick
// if we are not explicitly prevented from.
// The trick will be enabled in mobile browsers which are not
// Android Gingerbread.
function shouldEnableHA() {
  if(!__BROWSER__) {
    return false;
  }
  const { userAgent } = navigator;
  if(!userAgent) {
    return false;
  }
  // is mobile but not gingerbread
  return isMobile(userAgent) && !isGingerbread(userAgent);
}

function enableHA(styles) {
  // for each 'transform' property, set/prepend 'translateZ(0)'
  _.each(transformProperties, (property) => {
    if(styles[property] === void 0) {
      styles[property] = [transformHA, transformHA];
    }
    else {
      const [from, to] = styles[property];
      styles[property] = [`${transformHA} ${from}`, `${transformHA} ${to}`];
    }
  });
}

const _animations = privateSymbol('animations');
const DEFAULT_EASING = 'cubic-in-out';

const Mixin = {
  // prepare the property to avoid reshapes
  [_animations]: null,

  componentWillMount() {
    // initialize the property to no animations
    this[_animations] = {};
  },

  componentWillUnmount() {
    // abort any currently running animation
    if(this[_animations] !== null) {
      _.each(this[_animations], (animation, name) => this.abortAnimation(name, animation));
    }
  },

  getAnimatedStyle(name) {
    // typecheck parameters in dev mode
    if(__DEV__) {
      name.should.be.a.String;
    }
    return this.state && this.state[privateSymbol(`animation${name}`)] || {};
  },

  isAnimated(name) {
    // typecheck parameters in dev mode
    if(__DEV__) {
      name.should.be.a.String;
    }
    return (this[_animations][name] !== void 0);
  },

  abortAnimation(name) {
    // typecheck parameters in dev mode
    if(__DEV__) {
      name.should.be.a.String;
    }
    if(this[_animations][name] !== void 0) {
      const { easingFn, onAbort, nextTick, t, currentStyle } = this[_animations][name];
      raf.cancel(nextTick);
      onAbort(currentStyle, t, easingFn(t));
      // unregister the animation
      delete this[_animations][name];
      return true;
    }
    // silently fail but returns false
    return false;
  },

  animate(name, fromStyle, toStyle, duration, opts = {}) {
    const easing = opts.easing === void 0 ? DEFAULT_EASING : opts.easing;
    const onTick = opts.onTick || _.noop;
    const onAbort = opts.onAbort || _.noop;
    const onComplete = opts.onComplete || _.noop;
    const disableMobileHA = !!opts.disableMobileHA;
    // typecheck parameters in dev mode
    if(__DEV__) {
      name.should.be.a.String;
      fromStyle.should.be.an.Object;
      toStyle.should.be.an.Object;
      duration.should.be.a.Number.which.is.above(0);
      onTick.should.be.a.Function;
      onAbort.should.be.a.Function;
      onComplete.should.be.a.Function;
    }
    // if there is already an animation with this name, abort it
    if(this[_animations][name] !== void 0) {
      this.abortAnimation(name);
    }
    // create the actual easing function using tween-interpolate (d3 smash)
    const easingFn = _.isObject(easing) ? tween.ease.apply(tween, [easing.type, ...easing.arguments]) : tween.ease(easing);
    // reformat the input: [property]: [from, to]
    const styles = {};
    // unless told otherwise below, the value is assumed constant
    _.each(fromStyle, (value, property) =>
      styles[property] = [value, value]
    );
    // if we dont have an initial value for each property, assume it is constant from the beginning
    _.each(toStyle, (value, property) =>
      styles[property] = styles[property] === void 0 ? [value, value] : [styles[property][0], value]
    );
    // get an interpolator for each property
    const interpolators = _.mapValues(styles, ([from, to]) => tween.interpolate(from, to));
    // pre-compute the final style
    const finalStyle = _.mapValues(styles, ([from, to]) => { void from; return to; });

    // do the hardware acceleration trick
    if(!disableMobileHA && shouldEnableHA()) {
      enableHA(transformProperties, styles);
    }

    const start = Date.now();
    const stateKey = privateSymbol(`animation${name}`);

    // the main ticker function
    const tick = () => {
      const now = Date.now();
      // progress: starts at 0, ends at > 1
      const t = (now - start) / duration;
      // we are past the end
      if(t > 1) {
        this.setState({ [stateKey]: finalStyle });
        onTick(finalStyle, 1, easingFn(1));
        onComplete(finalStyle, t, easingFn(t));
        // unregister the animation
        delete this[_animations][name];
        return;
        // the animation is not over yet
      }
      const currentStyle = _.mapValues(interpolators, (fn) => fn(easingFn(t)));
      this.setState({ [stateKey]: currentStyle });
      onTick(currentStyle, t, easingFn(t));
      Object.assign(this[_animations][name], { nextTick: raf(tick), t, currentStyle });
    };

    // register the animation
    this[_animations][name] = { easingFn, onAbort, nextTick: raf(tick), t: 0, currentStyle: fromStyle };
    return this;
  },
};

export default Mixin;
