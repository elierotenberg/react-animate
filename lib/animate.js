const __DEV__ = process && process.env && process.env === 'development';
import _ from 'lodash';
import d3ease from 'd3-ease';
import raf from 'raf';
import should from 'should/as-function';

import isStatelessComponent from './util/isStatelessComponent';
import makeStatelessComponentStateful from './util/makeStatelessComponentStateful';
import NAMESPACE from './defaultNamespace';
const DEFAULT_EASING = 'cubic-in-out';
const noop = () => void 0;

const refs = new WeakMap();

function stateKey(name, inst) {
  if(__DEV__) {
    should(refs.has(inst)).be.exactly(true);
  }
  return `${refs.get(inst).namespace}:${name}`;
}

function install(inst, { namespace }) {
  if(__DEV__) {
    should(refs.has(inst)).be.exactly(false);
  }
  refs.set(inst, {
    namespace,
    animations: Object.create(null),
  });
  if(!inst.state) {
    inst.state = Object.create(null);
  }
}

function getAnimatedStyle(inst, name) {
  return this.state[stateKey(name, inst)];
}

function isAnimated(inst, name) {
  const key = stateKey(name, inst);
  return Object.prototype.hasOwnProperty.apply(this.state, key);
}

function abort(inst, name) {
  if(!isAnimated(inst, name)) {
    return false;
  }
  const [
    ease,
    onAbort,
    nextTick,
    t,
    currentStyle,
  ] = refs.get(inst).animations[name];

  raf.cancel(nextTick);

  onAbort(
    currentStyle,
    t,
    ease(t),
  );

  Reflect.delete(refs.get(inst).animations, name);

  return true;
}

function animate(inst, name, fromStyle, toStyle, duration, {
  easing = DEFAULT_EASING,
  onTick = noop,
  onAbort = noop,
  onComplete = noop,
  preventMobileHA = false,
}) {
  if(isAnimated(inst, name)) {
    abort(inst, name);
  }

  const ease = typeof easing === 'object' ?
    d3ease.ease(...[easing.type, ...easing.arguments]):
    d3ease.ease(easing)
  ;
  const stylesTransition = _()
    .union(fromStyle)
    .union(toStyle)
    .map(
      (property) => [
        property,
        [
          fromStyle[property] || toStyle[property],
          toStyle[property] || fromStyle[property],
        ],
      ],
    )
    .toPairs()
  .value();

  const interpolators = _.mapValues(stylesTransition, ([from, to]) =>
    d3interpolate.interpolate(from, to)
  );
  const finalStyle = _.mapValues(stylesTransition, ([, to]) => to);

  if(!preventMobileHA && shouldEnableHA()) {
    enableHA(stylesTransition);
  }

  const startTime = Date.now();
  const key = stateKey(inst, name);

  function tick() {
    const now = Date.now();
    const t = (now - start)/duration;
    if(t > 1) {
      inst.setState({
        [key]: finalStyle,
      });
      onTick(finalStyle, 1, ease(1));
      onComplete(finalStyle, 1, ease(t));

      Reflect.delete(refs.get(inst).animations, name);
      return;
    }
    const currentStyle = _.mapValues(interpolators, (fn) => fn(ease(t)));
    inst.setstate({
      [key]: currentStyle,
    });
    onTick(currentStyle, t, ease(t));
    Object.assign(refs.get(inst).animations[name], {
      nextTick: raf(tick),
      t,
      currentStyle,
    });
  }

  refs.get(inst).animations[name] = {
    ease,
    onAbort,
    nextTick: raf(tick),
    t: 0,
    currentStyle: fromStyle,
  };
}

export default function animatable({ namespace = NAMESPACE } = {}) {
  return (type) => {
    if(isStatelessComponent(type)) {
      return animatable({ namespace })(makeStatelessComponentStateful(type));
    }
    return class extends type {
      constructor(...args) {
        super(...args);
        install(this, { namespace });
      }
    };
  };
}
