(function() {

    define([
        'backbone.marionette',
        'app',
        'apps/lesson/learn/structure/list/list_controller',
        'apps/lesson/learn/structure/list/list_view'
    ],
    function(Marionette, App){

        // Define our Module under App
        var StructureApp = App.module("LessonApp.LearnApp.StructureApp");

        /*
        ** Configure the Module
        */
        StructureApp.startWithParent = false;

        /*
        ** Setup the Router for this module
        */
        StructureApp.Router = Backbone.Marionette.AppRouter.extend({
            appRoutes: {
                'lessons/:id/learn/structure': 'listStructure',
                'lessons/:id/learn/structure/:page': 'listStructure',
            }
        });

        /*
        ** Setup our module's API
        */
        var API = {
            listStructure: function(id, page) {
                App.trigger("lesson:setup:layout", id);
                App.trigger('lesson:learn:setup:layout', id);

                //Forcing page number in url
                if (page === undefined) {
                    var page = 1;
                    App.navigate('/lessons/'+ id + '/learn/structure/' + page);
                }

                StructureApp.List.Controller.listStructure(page);

            }
        };

        /*
        ** Listen for events on the app
        */
        App.on("lesson:learn:structure:list", function(id, page, options) {
            var id = id || 1; //If a lesson id is not passed, set id to 1
            var page = page || 1;
            App.navigate("lessons/" + id + "/learn/structure/" + page);
            API.listStructure(id, page, options);
        });

        /*
        ** Add application initializers
        */
        StructureApp.addInitializer(function() {
            var router = new StructureApp.Router({
                controller: API
            });
        });

        // Return the module
        return StructureApp;

    });

}).call(this);
