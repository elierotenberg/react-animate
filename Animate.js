var _ = require("lodash");
var d3 = require("d3");
var raf = require("raf");

var getInterpolator = function getInterpolator(from, to) {
	return d3.interpolate(from, to);
};

var startInterpolation = function startInterpolation(properties, easing, duration, onTick, onComplete) {
	var aborted = false;
	var nextTick = null;
	var interpolators = {};
	_.each(properties, function(specs, name) {
		interpolators[name] = getInterpolator(specs.from, specs.to);
	});
	var ease;
	if(_.isObject(easing)) {
		assert(easing.type);
		assert(easing.arguments);
		ease = d3.ease.apply(d3, _.union([easing.type], easing.arguments));
	}
	else {
		ease = d3.ease(easing);
	}
	var abort = function abort() {
		aborted = true;
		if(nextTick) {
			raf.cancel(nextTick);
		}
	};
	var start = Date.now();
	var end = start + duration;
	var tick = function tick() {
		if(aborted) {
			return;
		}
		else {
			var now = Date.now();
			var t = (now - start)/(end - start);
			if(t > 1) {
				var finalProperties = {};
				_.each(properties, function(specs, name) {
					finalProperties[name] = specs.to;
				});
				onTick(finalProperties);
				_.defer(onComplete);
				return;
			}
			else {
				var tickProperties = {};
				_.each(_.keys(properties), function(name) {
					tickProperties[name] = interpolators[name](ease(t));
				});
				onTick(tickProperties);
				nextTick = raf(tick);
			}
		}
	};
	tick();

	return {
		abort: abort
	};
};

module.exports = {
	getInterpolator: getInterpolator,
	startInterpolation: startInterpolation,
};
