(function() {

    define([
        'backbone.marionette'
    ],
    function(Marionette){

        Backbone.Marionette.Transition = {

            initialize: function() {
                var transEndEventNames = {
                    'WebkitTransition'    : 'webkitTransitionEnd',
                    'MozTransition'        : 'transitionend',
                    'OTransition'            : 'oTransitionEnd',
                    'msTransition'          : 'MSTransitionEnd',
                    'transition'               : 'transitionend'
                };
                this.transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];
            },

            /*
            ** transitionEl is the function used to transition two elements on the page.
            ** @param $oldEl jQuery OBJECT - the original jQuery element being transitioned out
            ** @param $newEl jQuery OBJECT - the new jQuery element being transitioned in
            ** @param options Optional OBJECT - object consisten of several transition options
            **      @param options keys - the keys acceptable in the options object | type, direction, transitionEndCb
            */
            transitionEl: function($oldEl, $newEl, options) {

                var self = this,
                    deferred = $.Deferred();

                if (!self._isInitialized) {
                    self.initialize();
                    self._isInitialized = true;
                }

                if (typeof options == 'undefined') options = {};

                _.defaults(options, {
                    type: 'slide',
                    direction: 'left',
                    transitionEndCb: null
                });

                // clean up the old listeners, just to ensure we only have 1 active.
                $oldEl.off(self.transEndEventName);

                // Move the new view to an off-screen position using transformation matrix
                var translationClass;

                if (options.direction === 'up' || options.direction === 'down') {
                    deferred.resolve();
                } else {
                    deferred.resolve();
                }

                deferred.then(function() {
                    // The $newEl is coming "in", so add the "in" class to it, and handle "in" via css
                    $newEl.addClass('in');

                    // Determine the type of transition and build the css transformation.
                    if(options.type === 'slide') {
                        translationClass = 'slide';
                        translationClass = translationClass + ' ' + options.direction;
                    }
                    else if(options.type === 'fade') {
                        translationClass = 'fade';
                    }

                    // Add the new view to the dom
                    $oldEl.append($newEl);

                    // Turn on the css animations to enable the transition. We do this here,
                    // before the tranision instead of after the transition is complete
                    // because it causes less of a visual 'snap' as the pattern moves.
                    // The old view is on its' way out, so add "out" class along with transitionClass
                    $oldEl.addClass('animated' + ' ' + translationClass + ' ' + 'out');

                    // after transition, clean up by removing the old view, then
                    // re-position everything back to a zero-point. There might be a problem
                    // relying on the transitionEnd event because there are cases where it
                    // does not fire.
                    $oldEl.on(self.transEndEventName, function () {
                        $oldEl.off(self.transEndEventName);
                        // clean up new view and place everything back
                        // to a sane starting position, ready for next transition.
                        $oldEl.removeClass('animated' + ' ' + translationClass + ' ' + 'out');
                        $newEl.removeClass('in');

                        if (_.isFunction(options.transitionEndCb)) {
                            options.transitionEndCb.call(self);
                        }
                    });

                });


            }

        };

        return Backbone.Marionette.Transition;

    });

}).call(this);
