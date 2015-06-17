import raf from 'raf';
import tween from 'tween-interpolate';
import _ from 'lodash';
const __DEV__ = process.env.NODE_ENV === 'development';
const __BROWSER__ = (typeof window === 'object');

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

const Animate = {
  '@animations': Symbol('animations'),

  '@abortAnimation': Symbol('abortAnimation'),

  '@animate': Symbol('animate'),

  '@getAnimatedStyle': Symbol('getAnimatedStyle'),

  '@isAnimated': Symbol('isAnimated'),

  animate(...args) {
    if(__DEV__) {
      this.should.not.be.exactly(Animate);
    }
    return this[Animate['@animate']](...args);
  },

  abortAnimation(...args) {
    if(__DEV__) {
      this.should.not.be.exactly(Animate);
    }
    return this[Animate['@abortAnimation']](...args);
  },

  getAnimatedStyle(...args) {
    if(__DEV__) {
      this.should.not.be.exactly(Animate);
    }
    return this[Animate['@getAnimatedStyle']](...args);
  },

  isAnimated(...args) {
    if(__DEV__) {
      this.should.not.be.exactly(Animate);
    }
    return this[Animate['@isAnimated']](...args);
  },

  DEFAULT_EASING: 'cubic-in-out',

  extend: null,
};

function animatedStyleStateKey(name) {
  return `Animate@${name}`;
}

Animate.extend = (Component) => class extends Component {
  constructor(props) {
    super(props);
    if(!_.isObject(this.state)) {
      this.state = {};
    }
    this[Animate['@animations']] = {};
  }

  componentWillUnmount() {
    if(super.componentWillUnmount) {
      super.componentWillUnmount();
    }
    if(this[Animate['@animations']] !== null) {
      _.each(this[Animate['@animations']], (animation, name) => Animate.abortAnimation.call(this, name, animation));
    }
  }

  [Animate['@getAnimatedStyle']](name) {
    if(__DEV__) {
      name.should.be.a.String;
    }
    return this.state && this.state[animatedStyleStateKey(name)] || {};
  }

  [Animate['@isAnimated']](name) {
    if(__DEV__) {
      name.should.be.a.String;
    }
    return (this[Animate['@animations']][name] !== void 0);
  }

  [Animate['@abortAnimation']](name) {
    if(__DEV__) {
      name.should.be.a.String;
    }
    if(this[Animate['@animations']][name] !== void 0) {
      const { easingFn, onAbort, nextTick, t, currentStyle } = this[Animate['@animations']][name];
      raf.cancel(nextTick);
      onAbort(currentStyle, t, easingFn(t));
      // unregister the animation
      delete this[Animate['@animations']][name];
      return true;
    }
    // silently fail but returns false
    return false;
  }

  [Animate['@animate']](name, fromStyle, toStyle, duration, opts = {}) {
    const {
      easing = Animate.DEFAULT_EASING,
      onTick = () => void 0,
      onAbort = () => void 0,
      onComplete = () => void 0,
      disableMobileHA = false,
    } = opts;

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
    if(this[Animate['@animations']][name] !== void 0) {
      Animate.abortAnimation.call(this, name);
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
    // pre-compute the final style (ignore [from])
    const finalStyle = _.mapValues(styles, ([, to]) => to);

    // do the hardware acceleration trick
    if(!disableMobileHA && shouldEnableHA()) {
      enableHA(transformProperties, styles);
    }

    const start = Date.now();
    const stateKey = animatedStyleStateKey(name);

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
        delete this[Animate['@animations']][name];
        return;
        // the animation is not over yet
      }
      const currentStyle = _.mapValues(interpolators, (fn) => fn(easingFn(t)));
      this.setState({ [stateKey]: currentStyle });
      onTick(currentStyle, t, easingFn(t));
      Object.assign(this[Animate['@animations']][name], { nextTick: raf(tick), t, currentStyle });
    };

    // register the animation
    this[Animate['@animations']][name] = {
      easingFn,
      onAbort,
      nextTick: raf(tick),
      t: 0,
      currentStyle: fromStyle,
    };
    return this;
  }
};

export default Animate;
