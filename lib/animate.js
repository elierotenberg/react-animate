import _ from 'lodash';
import d3ease from 'd3-ease';
import raf from 'raf';

import isStatelessComponent from './util/isStatelessComponent';
import makeStatelessComponentStateful from './util/makeStatelessComponentStateful';
import NAMESPACE from './defaultNamespace';
const DEFAULT_EASING = 'cubic-in-out';
const noop = () => void 0;

export default function animatable({ namespace = NAMESPACE } = {}) {
  return (type) => {
    if(isStatelessComponent(type)) {
      return animatable({ namespace })(makeStatelessComponentStateful(type));
    }
    const $ns = (suffix) => `${namespace}:${suffix}`;
    const $key = (name) => $ns(`animatedStyle:${name}`);
    const $animate = $ns('start');
    const $abort = $ns('abort');
    const $isAnimated = $ns('isAnimated');
    const $getAnimatedStyle = $ns('getAnimatedStyle');
    return class extends type {
      constructor(...args) {
        super(...args);
        if(!this.state) {
          this.state = Object.create(null);
        }
        this[namespace] = Object.create(null);
      }

      [$getAnimatedStyle](name) {
        return this.state[$key(name)];
      }

      [$isAnimated](name) {
        return Object.prototype.hasOwnProperty.apply(this.state, $key(name));
      }

      [$abort](name) {
        const $k = $key(name);
        if(!this[$isAnimated[name]]) {
          return false;
        }
        const [ease, onAbort, nextTick, t, currentStyle] = this[namespace][$k];
        raf.cancel(nextTick);
        onAbort(currentStyle, t, ease(t));
        Reflect.delete(this[namespace], $k);
        return true;
      }

      [$animate](name, fromStyles, toStyles, duration, {
        easing = DEFAULT_EASING,
        onTick = noop,
        onAbort = noop,
        onComplete = noop,
        preventMobileHA = false,
      } = {}) {
        if(this[$isAnimated](name)) {
          this[$abort](name);
        }
        const ease = typeof easing === 'object' ?
          d3ease.ease(...[easing.type, ...easing.arguments]):
          d3ease.ease(easing)
        ;
        const stylesTransition = _()
          .union(fromStyles)
          .union(toStyles)
          .map(
            (property) => [
              property,
              [
                fromStyles[property] || toStyles[property],
                toStyles[property] || fromStyles[property],
              ],
            ],
          )
          .toPairs()
        .value();

        const interpolators = _.mapValues(stylesTransition, ([from, to]) => d3interpolate.interpolate(from, to));
        const finalStyle = _.mapValues(stylesTransition, ([, to]) => to);

        if(!preventMobileHA && shouldEnableHA()) {
          enableHA(stylesTransition);
        }

        const startTime = Date.now();
        const $k = $key(name);
      }
    };
  };
}
