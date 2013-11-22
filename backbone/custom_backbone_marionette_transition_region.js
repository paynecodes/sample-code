(function() {

    define([
        'backbone.marionette',
        'lib/transition_adapter'
    ],
    function(Marionette){

        Backbone.Marionette.AnimatedRegion = Backbone.Marionette.Region.extend({

            // Very similar to show(), but uses css transition class between views
            // @param newView - this is the view that will replace the current view in the region
            // @param type - the type of animation to use while transitioning the newView in. Accepts 'slide' and 'fade'. Defaults to 'slide'
            // @param direction - the direction of the 'slide' animation. Accepts 'left', 'right', 'down', 'up'. Defaults to 'left'. Only works for 'slide' type animation
            transitionToView: function(newView, options) {

                var self = this;

                // If options is undefined, define an object clone to setup defaults later
                // If options is defined, go ahead and shallow clone it
                // We need to clone the object becuase of the way Javascript passes the options
                // by reference. If we didn't clone the options object, the changes we make to options
                // could affect other calls using the same options object
                // For example, if we called the following without using a cloned options object here,
                // The _.defaults function below would mutate the options object for the second caller.
                //
                // App.headerRegion.transitionToView(headerView, options);
                // App.mainRegion.transitionToView(lessonsView, options); // this would get a mutated options object passed in because the first instance would add properties to 'options' that we don't need the second time 'options' is passed in.
                if (typeof options == 'undefined') {
                    optionsClone = {};
                } else {
                    optionsClone = _.clone(options);
                }

                _.defaults(optionsClone, {
                    type: 'slide',
                    direction: 'left',
                    transitionEndCb: function() {
                        // clean up the old view
                        self.close();
                        self.currentView = newView;

                        // do the things show would normally do after showing a new view
                        Backbone.Marionette.triggerMethod.call(newView, "show");
                        Backbone.Marionette.triggerMethod.call(self, "show", newView);
                    }
                });

                // Do we have a view currently?
                var view = this.currentView;

                // If we don't currently have a view, simply show the newView and exit
                if (!view || view.isClosed){
                    this.show(newView);
                    return;
                }

                view.triggerMethod('willTransition');

                // Tell this region to stop listening for 'render' on the newView
                this.stopListening(newView, 'render');

                // Wait for the new view to render, then initialize a transition to
                // show the new view while hiding the old.
                this.listenTo(newView, 'render', function() {
                    Backbone.Marionette.Transition.transitionEl(self.$el, newView.$el, optionsClone);

                }); // end listenTo

                newView.render();

            } // end transitionToView

        });

        return Backbone.Marionette.AnimatedRegion;

    });

}).call(this);
