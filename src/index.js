import raf from 'raf';
import tween from 'tween-interpolate';

function private(property) {
  return `__animateMixin${property}`;
}

function shouldEnableHA() {
  if(!__BROWSER__) {
    return false;
  }
  const { userAgent } = navigator;
  if(!userAgent) {
    return false;
  }
  // is mobile but not gingerbread
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) && /Android 2\.3\.[3-7]/i.test(userAgent);
}

const _animations = private('animations');

const DEFAULT_EASING = 'cubic-in-out';
const transformProperties =  ['WebkitTransform', 'MozTransform', 'MSTransform', 'OTransform', 'Transform'];
const transformHA = 'translateZ(0)';

export default {
  [_animations]: null,

  componentWillMount() {
    this[_animations] = {};
  },

  componentWillUnmount() {
    if(this[_animations] !== null) {
      _.each(this[_animations], (animation, name) => this.abortAnimation(name));
    }
  },

  abortAnimation(name) {
    if(__DEV__) {
      name.should.be.a.String;
    }
    if(this[_animations][name] !== void 0) {
      const { easingFn, onAbort, nextTick, t, currentStyle } = this[_animations][name];
      raf.cancel(nextTick);
      onAbort(currentStyle, t, easingFn(t));
      delete this[_animations][name];
    }
  },

  animate(name, fromStyle, toStyle, duration, opts = {}) {
    const easing = opts.easing  === void 0 ? DEFAULT_EASING : opts.easing;
    const onTick = opts.onTick || _.noop;
    const onAbort = opts.onAbort || _.noop;
    const onComplete = opts.onComplete || _.noop;
    const disableMobileHA = !!opts.disableMobileHA;
    if(__DEV__) {
      name.should.be.a.String;
      fromStyle.should.be.an.Object;
      toStyle.should.be.an.Object;
      duration.should.be.a.Number.which.is.not.above(0);
      onTick.should.be.a.Function;
      onAbort.should.be.a.Function;
      onComplete.should.be.a.Function;
    }
    const easingFn = _.isObject(easing) ? tween.ease.apply(tween, [easing.type, ...easing.arguments]) : tween.ease(easing);
    const styles = {};
    _.each(fromStyle, (value, property) => styles[property] = [value, value]);
    _.each(toStyle, (value, property) => styles[property] = styles[property] === void 0 ? [value, value] : [styles[property][0], value]);
    const interpolators = _.mapValues(styles, ([from, to]) => tween.interpolate(from, to));
    const finalStyle = _.mapValues(styles, ([from, to]) => to);

    if(!disableMobileHA && shouldEnableHA()) {
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

    const start = Date.now();
    const stateKey = private(`animation${name}`);

    const tick = () => {
      const now = Date.now();
      const t = (now - start)/duration;
      if(t > 1) {
        this.setState({ [stateKey]: finalStyle });
        onTick(finalStyle, 1, easingFn(1));
        onComplete(finalStyle, t, easingFn(t));
        delete this[_animations][name];
        return;
      }
      const currentStyle = _.mapValues(interpolators, (fn) => fn(easingFn(t)));
      this.setState({ [stateKey]: currentStyle });
      onTick(currentStyle, t, easingFn(t));
      Object.assign(this[_animations][name], { nextTick: raf(tick), t, currentStyle });
    };

    this[_animations][name] = { easingFn, onAbort, nextTick: raf(tick), t: 0, currentStyle: fromStyle };
    return this;
  },
};
