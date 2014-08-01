react-animate
=============
Allows to animate parts of a React components programmatically, without bypassing React internals and without altering the DOM directly.
It works by leveraging `d3` interpolators and applying them to special state keys containing the styles.
Multiples animations can be run concurrently since each animation is designed by a name. Different names target different animations.

Usage
=====
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

var MyComponent = React.createClass({
	mixins: [AnimateMixin],
	/* ... */
	showOff: function showOff() {
		this.animate("my-custom-animation",
			fromCSS("{ transform: scale(100%); }"),
			fromCSS("{ transform: scale(200%); }"),
			"cubic-in-out", 5000, this.stopShowingOff);
		this.setState({
			showoff: true,
		});
	},
	/* ... */
});
```