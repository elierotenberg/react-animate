var _ = require("lodash");
var assert = require("assert");
var Animate = require("./Animate");

var shouldEnableHA = function() {
    var userAgent = navigator.userAgent;
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    var isGingerbread = /Android 2\.3\.[3-7]/i.test(userAgent)
    return userAgent && isMobile && !isGingerbread;
};

var transformProperties = ["WebkitTransform", "MozTransform", "MSTransform", "OTransform", "Transform"];

/**
 * Animation component Mixin.
 * Enables the uage of {AnimateMixin.animate}, {AnimateMixin.abortAnimation}
 * and {AnimateMixin.getAnimatedStyle} to animate parts of the rendered component.
 * @mixin
 * @implements {React.Mixin}
 * @see {http://facebook.github.io/react/docs/reusable-components.html#mixins}
 * @public
 */
var AnimateMixin = {
    /**
     * Allocates {AnimateMixin._currentAnimation} for the current component instance.
     * @see {http://facebook.github.io/react/docs/component-specs.html#mounting-componentwillmount}
     * @public
     */
    componentWillMount: function componentWillMount() {
        this._currentAnimation = {};
    },
    /**
     * Aborts any undergoing animation, and frees {AnimateMixin._currentAnimation} for the current component instance.
     * @see {http://facebook.github.io/react/docs/component-specs.html#mounting-componentwillunmount}
     */
    componentWillUnmount: function componentWillUnmount() {
        _.each(this._currentAnimation, function(animation) {
            animation.abort();
        });
        this._currentAnimation = null;
    },
    /**
     * Hash of the currently active animations.
     * Each name maps to an {Animate} object, returned by {Animate.startInterpolation}.
     * Each {Animate} object represents an undergoing animation, and has a single
     * {Animate#abort} method, which cancels the animation.
     * @type {Object.<String, Object>}
     * @private
     */
    _currentAnimation: null,
    /**
     * Callback that updates an active animations' style and triggers an update
     * by calling {ReactComponent#setState}.
     * This function is called once per animation frame (or once per 1/60s if {requestAnimationFrame}
     * is polyfilled).
     * @param {String} name Name of the animation to update.
     * @param {Object.<String, String>} properties Updated properties map.
     * @private
     */
    _updateAnimatedStyle: function updateAnimatedStyle(name, properties) {
        this.setState(_.object([
            ["_animatedStyle:" + name, properties],
        ]));
    },
    /**
     * Starts a new animation with a given name.
     * The properties hash should map a property name to a record { from: *, to: * }
     * indicating the start and end values for this property.
     * The easing function can be any easing accepted by {d3}.
     * Upon completion, the optional argument {onComplete} will be called back.
     * Returns a record containing a single property, {abortAnimation}, which can be called to abort
     * the animation manually before its completion.
     * @param {String} name Name of the animation to start. If an animation with this name already exists, it will be aborted first.
     * @param {Object.<String, Object>} easing Easing function. Any easing accepted by {d3} will be accepted.
     * @param {Number} duration Duration of the animation, in ms.
     * @param {Function} [onComplete] (Optionnal) Function to be called back when the animation completes.
     * @return {Object.<String, Function>}
     * @public
     */
    animate: function animate(name, from, to, easing, duration, onComplete, onAbort, disableMobileHA) {
        onComplete = onComplete || _.identity;
        onAbort = onAbort || _.identity;
        /* Ensure keys of from and to are the same; copy keys that are in one but not in the other. */
        _.each(from, function(v, k) {
            if(!_.has(to, k)) {
                to[k] = v;
            }
        });
        _.each(to, function(v, k) {
            if(!_.has(from, k)) {
                from[k] = v;
            }
        });
        if(shouldEnableHA()) {
            _.each(transformProperties, function(k) {
                if(!_.has(from, k)) {
                    from[k] = "translateZ(0)";
                }
                else {
                    from[k] = "translateZ(0) " + from[k];
                }
                if(!_.has(to, k)) {
                    to[k] = "translateZ(0)";
                }
                else {
                    to[k] = "translateZ(0) " + to[k];
                }
            });
        }
        var properties = {};
        _.each(from, function(f, k) {
            var t = to[k];
            properties[k] = {
                from: f,
                to: t
            };
        });
        var self = this;
        if(_.has(this._currentAnimation, name)) {
            this._currentAnimation[name].abort();
        }
        this._currentAnimation[name] = Animate.startInterpolation(properties, easing, duration, function(animatedStyle) {
            self._updateAnimatedStyle(name, animatedStyle);
        }, onComplete, onAbort);
        return {
            abortAnimation: function() {
                self.abortAnimation(name);
            },
        };
    },
    /**
     * Abort a previously started, unfinished animation.
     * @param {String} name Name of the animation to abort.
     * @throws {AssertError} If the animation never existed or has already finished.
     * @public
     */
    abortAnimation: function abortAnimation(name) {
        assert(this._currentAnimation[name]);
        this._currentAnimation[name].abort();
    },
    /**
     * Gets the map of the animated values of the properties for the given animation
     * name, to be injected into the markup inside a {ReactComponent#render} function.
     * @param {String} name Name of the animation.
     * @return {Object.<String, String>}
     */
    getAnimatedStyle: function getAnimatedStyle(name) {
        return this.state["_animatedStyle:" + name];
    },
};

module.exports = AnimateMixin;
