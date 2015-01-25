react-animate
=============
Allows to animate parts of a React components programmatically, without bypassing React internals and without altering the DOM directly.

It works by interpolating intermediate styles values and applying them to special state keys containing the styles, on each animation frame using `requestAnimationFrame`.

Multiples animations can be run concurrently since each animation is identified by a name. Different names target different animations.

### Usage
A component with the `AnimateMixin` mixin gets three new methods: `animate`, `getAnimatedStyle`, and `abortAnimation` (which is of limited use under normal circonstances
since the mixin takes care of aborting any animations before unmounting).

Trigger an animation with `animate`, and inject the associated style in the `render` function using `getAnimatedStyle`.
```js
React.createClass({
  mixins: [AnimateMixin],

  fadeIn() {
    this.animate(
      'my-custom-animation', // animation name
      { opacity: 0 }, // initial style
      { opacity: 1 }, // final style
      1000, // animation duration (in ms)
      { easing: 'linear' } // other options
    );
  },

  render() {
    return <div>
      <button onClick={this.fadeIn}>Click to fade in</button>
      <div style={this.getAnimatedStyle('my-animation')}>
        This text will appear soon after the click.
      </div>
    </div>;
  },
});
```

### Installation

`npm install react-animate --save`

CommonJS:

`var AnimateMixin = require('react-animate');`

ES6 modules (via `6to5`):

`import AnimateMixin from 'react-animate';`

### API

#### `this.animate(name, initialStyle, finalStyle, duration, opts)`

Start an animation. Returns `this` for chaining.

- `name` can be any string. If you restart an animation with the same name, the previous animation with the same name will be cancelled and replaced by this one.

- `initialProperties` and `finalProperties` are styles hashes, like the ones used by React, eg. `{ fontSize: '12px' }` means `font-size: 12px` when translated to CSS by React. If a property is specified in one of the hashed by not the other, it is assumed to remain constant over the duration of the animation.

- `duration` is a number of milliseconds representing the total duration of the animation.

- `options` is an optional hash of optionals parameters :

  - `easing`: the easing of the animation timing. Can be either a string or a `{ type, arguments }` object. In both case, it uses `d3` under the hood, refer to their [docs](https://github.com/mbostock/d3/wiki/Transitions#ease). Defaults to `cubic-in-out`.

  - `onTick`, `onAbort`, `onComplete`: optional callbacks functions that will be invoked respectively on each tick, on animation abort, or on animation complete. They will be called with `(currentStyle, progress, easedProgress)`. Defaults to no-op.

  - `disableMobileHA`: flag to prevent the heuristic addition of dummy properties to attempt to force hardware acceleration on mobiles. Defaults to `false`.

#### `this.getAnimatedStyle(name)`

Get the current value of the animated style. You can call it from `render()` and pass it directly as the `style` prop of a React DOM element such as `<div>`. If no animation with this name exists, it will fail silently and return an empty hash (`{}`).

#### `this.abortAnimation(name)`

Abort the animation with the given name, if it exists. Returns `true` if an animation with this name existed. Returns `false` otherwise.

Note that you don't have to call this function in `componentWillUnmount`. `react-animate` will take care of that for you.

#### OMG ES6 EVERYWHERE

You don't need to use ES6 or any transpiler to use this package.

It is entirely transpiled to ES5 using `6to5` and you can use it in your regular CommonJS environment (eg. `node`, `browserify`, `webpack`). You should try it sometime, though.
