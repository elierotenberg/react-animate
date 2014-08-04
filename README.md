react-animate
=============
Allows to animate parts of a React components programmatically, without bypassing React internals and without altering the DOM directly.
It works by leveraging `d3` interpolators and applying them to special state keys containing the styles.
Multiples animations can be run concurrently since each animation is designed by a name. Different names target different animations.


### Demo and blogpost
See [this repo](https://github.com/elierotenberg/react-styling-demo) for explanations and demos.

### Usage
A component with the `AnimateMixin` mixin gets three new methods: `animate`, `getAnimatedStyle`, and `abortAnimation` (which is of limited use under normal circonstances
since the mixin takes care of aborting any animations before unmounting).
Trigger an animation with `animate`, and inject the associated style in the `render` function using `getAnimatedStyle`.
```js
/** @jsx React.DOM */
var React = require("react");
var AnimateMixin = require("react-animate");

var MyComponent = React.createClass({
	mixins: [AnimateMixin],
	getInitialState: function getInitialState() {
		return {
			showoff: false,
		};
	},
	showOff: function showOff() {
		this.animate("my-custom-animation", {
			opacity: 0,
		}, {
			opacity: 1,
		}, "cubic-in-out", 5000, this.stopShowingOff);
		this.setState({
			showoff: true,
		});
	},
	stopShowingOff: function stopShowingOff() {
		this.setState({
			showoff: false,
		});
	},
	render: function render() {
		return (
			<div>
				<a onClick={this.showOff}>Click to show off !</a>
				{ this.state.showoff ? (
					<span style={this.getAnimatedStyle("my-custom-animation")}>What a show off !</span>
				) : null }
			</div>
		);
	},
});
```

Since many animation-related properties needs vendor-prefixing, you can use `react-css` to autoprefix them.
```js
/** @jsx React.DOM */
var React = require("react");
var AnimateMixin = require("react-animate");
var fromCSS = require("react-css").fromCSS;

var from = fromCSS("{ transform: scale(100%); }");
var to = fromCSS("{ transform: scale(200%); }");

var MyComponent = React.createClass({
	mixins: [AnimateMixin],
	/* ... */
	showOff: function showOff() {
		this.animate("my-custom-animation",
			from,
			to,
			"cubic-in-out", 5000, this.stopShowingOff);
		this.setState({
			showoff: true,
		});
	},
	/* ... */
});
```

### API
The animated features are defined by a mixin at the top level of this package. To mix it in your components, simply include it in its `mixins` property.
```js
/** @jsx React.DOM */
var React = require("react");
var AnimateMixin = require("react-animate");

var MyComponent = React.createClass({
		mixins: [AnimateMixin],
		/* ... */
});
```

A component with `AnimateMixin` gets the following methods.

#### ReactComponent#animate(identifier: String, initialStyle: Object, finalStyle: Object, easing: String|Object, duration: Number, onComplete: Function?, disableMobileHA: boolean?): Object
Start an animation with the specified parameters. During each available animation frame, `this.setState` will be called, triggering a component update.
- `idenfitier: String`. Can be any string, and is used to identify a single animation within a component, which can be refered to in other methods.
		Examples:  `"fade-in-page"`, `"flip-this-image"`, `"however-you-want-to-name-me"`.
- `initialStyle: Object`. Describes the initial state of the animation, using camelCased keys. If you are lazy, you may want to read this from the DOM beforehand using `getDOMNode`, but thats up to yo as it may induce [layout thrashing](http://wilsonpage.co.uk/preventing-layout-thrashing/).
		Example: `{ backgroundColor: "#fff", transform: "translateX(30px)" }`.
- `finalStyle: Object`. Describes the final state of the animation, using camelCased keys.
		Example: `{ backgroundColor: "#000", transform: "translateX(120px)" }`.
- `easing: String|Object`. Easing to apply to the transition. All [`d3` easings](https://github.com/mbostock/d3/wiki/Transitions#d3_ease) are available. The `String` form is straightforward. The `Object` form is expected to have 2 properties, `type: String` and `arguments: Array`, which we be passed to `d3.ease`.
		Examples: `"linear"`, `"cubic-in"`, `"exp-out"`, `{ type: "poly", arguments: [4]}`.
- `duration: Number`. Duration of the animation, in milliseconds. Note that since under the hood `react-animate` uses `requestAnimationFrame`, this is the actual duration between the beginning and the end of the animation, not the time spent animating.
		Examples: `1000`, `0`.
- `[onComplete: Function]`. Callback to be invoked when the animation is complete. Defaults to a no-op.
		Example: `function() { console.warn("Animation has finished!"); }`
- `[onAbort: Function]`. Callback to be invoked when the animation is aborted. Defaults to a no-op. It is passed the progress at the time of the animation, in [0,1] range.
		Example: `function(t) { console.warn("Animation has aborted at ", t*100, "%."); }`
- `[disableMobileHA: boolean]`. Disable mobile hardware acceleration. Defaults to `false`. Internally, mobile hardware acceleration is activated by default on all mobile devices except `Android Gingerbread`.
- Return value: `Object`. An object containing a single property name `abortAnimation`, which upon invocation aborts the animation. It is of limited use in practice since `AnimateMixin` automatically aborts ongoing animations upon unmounting or starting a new animation with the same `identifier`, but it may be useful for example if the animated element is removed.
		Form: `{ abortAnimation: Function }`.

#### ReactComponent.getAnimatedStyle(identifier: String): Object
Obtain the current animated style for the given animation identifier.

- `identifier: String`. Identifier of a previously started animation. Throws if no such animation exists.
- Return value: `Object`. Current intermediate animated style, in the form of a React style object, to be passed to an animated ReactComponent.
		Example: `<img style={this.getAnimatedStyle("flip-this-image") />}`.

####ReactComponent.abortAnimation(identifier: String)
Abort a previously started animation.
- `identifier: String`. Identifier of a previously started animation. Throws if no such animation exists.

### LICENSE
MIT Elie Rotenberg 2014
