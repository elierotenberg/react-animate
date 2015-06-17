react-animate
=============
Allows to animate parts of a React components programmatically, without bypassing React internals and without altering the DOM directly.

It works by interpolating intermediate styles values and applying them to special state keys containing the styles, on each animation frame using `requestAnimationFrame`.

Multiples animations can be run concurrently since each animation is identified by a name. Different names target different animations.

### Usage

Fully embracing ES6 classes, `react-animate` allows you to extend a `React.Component` and add new methods without collision using ES6 `Symbol`. Such an extended class can be created by using `Animate.extend(Component)`. The new methods are accessible using either method call delegation or `Symbol` dereferencing:

```js
this[Animate['@animate']](...);
// or equivalently
Animate.animate.call(this, ...);
```

The extended component gets three new methods: `Animate['@animate']`, `Animate['@getAnimatedStyle']`, and `Animate['@abortAnimation']` (the latter being of limited use under normal circomstances - because `Animate` takes care of aborting running animations before unmounting - but can prove useful sometimes to actually interrupt a running animation).

Trigger an animation with `animate`, and inject the associated style in the `render` function using `getAnimatedStyle`:
```js
Animate.extend(class MyComponent extends React.Component {
  fadeIn() {
    // syntax using call delegation
    Animate.animate.call(this,
      'my-custom-animation', // animation name
      { opacity: 0 }, // initial style
      { opacity: 1 }, // final style
      1000, // animation duration (in ms)
      { easing: 'linear' } // other options
    );
    // alternate syntax using Symbol
    this[Animate['@animate']](
      'my-custom-animation', // animation name
      { opacity: 0 }, // initial style
      { opacity: 1 }, // final style
      1000, // animation duration (in ms)
      { easing: 'linear' } // other options
    );
  }

  render() {
    return <div>
      <button onClick={this.fadeIn}>Click to fade in</button>
      <div style={Animate.getAnimatedStyle.call(this, 'my-custom-animation')}>
        This text will appear soon after the click.
      </div>
    </div>;
  }
});
```

This module is written in ES6/7. You will need `babel` to run it.

### API

#### `animate(name, initialStyle, finalStyle, duration, opts)`

Start an animation. Returns `this` for chaining.

- `name` can be any string. If you restart an animation with the same name, the previous animation with the same name will be cancelled and replaced by this one.

- `initialProperties` and `finalProperties` are styles hashes, like the ones used by React, eg. `{ fontSize: '12px' }` means `font-size: 12px` when translated to CSS by React. If a property is specified in one of the hashed by not the other, it is assumed to remain constant over the duration of the animation.

- `duration` is a number of milliseconds representing the total duration of the animation.

- `options` is an optional hash of optionals parameters :

  - `easing`: the easing of the animation timing. Can be either a string or a `{ type, arguments }` object. In both case, it uses `d3` under the hood, refer to their [docs](https://github.com/mbostock/d3/wiki/Transitions#ease). Defaults to `cubic-in-out`.

  - `onTick`, `onAbort`, `onComplete`: optional callbacks functions that will be invoked respectively on each tick, on animation abort, or on animation complete. They will be called with `(currentStyle, progress, easedProgress)`. Defaults to no-op.

  - `disableMobileHA`: flag to prevent the heuristic addition of dummy properties to attempt to force hardware acceleration on mobiles. Defaults to `false`.

#### `getAnimatedStyle(name)`

Get the current value of the animated style. You can call it from `render()` and pass it directly as the `style` prop of a React DOM element such as `<div>`. If no animation with this name exists, it will fail silently and return an empty hash (`{}`).

#### `abortAnimation(name)`

Abort the animation with the given name, if it exists. Returns `true` if an animation with this name existed. Returns `false` otherwise.

Note that you don't have to call this function in `componentWillUnmount`. `react-animate` will take care of that for you.
