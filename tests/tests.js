var Animate = require("../Animate");

var interpolation = Animate.startInterpolation({
		opacity: {
			from: "0",
			to: "1",
		},
		backgroundColor: {
			from: "red",
			to: "green",
		},
	}, "cubic-in-out", 500, function(tickProperties, t) {
		console.warn(t, tickProperties);
	}, function() {
		console.warn("complete");
	}, function() {
		console.warn("abort");
});

setTimeout(interpolation.abort(), 1000);
