(function() {

    define([
        'backbone.marionette',
        'app',
        'entities/lessons'
    ],
    function(Marionette, App){

        // Define our Sub Module under App
        var List = App.module("LessonApp.LearnApp.StructureApp.List");

        /*
        ** Attach a public Controller object which allows our parent app (module) to call into
        */
        List.Controller = {
            listStructure: function(slideIndex) {
                var deferred = App.request('lesson:learn:setup:deferred');
                var state = deferred.state();
                var indexModifier = App.request('lesson:learn:views:index', 'structure');
                slideIndex = (parseInt(slideIndex) + parseInt(indexModifier) - 1);

                // If the deferred object is still pending add it to the queue
                // If not, go to the proper slide
                if (state === 'pending') {
                    deferred.then(function() {
                        App.trigger('lesson:learn:start:slide', slideIndex);
                    });
                } else if (state === 'resolved') {
                    App.trigger('lesson:learn:goTo:slide', slideIndex);
                }
            }

        };


        // Return the module
        return List;

    });

}).call(this);
