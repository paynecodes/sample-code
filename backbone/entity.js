(function() {

    define([
        'backbone',
        'app',
        'entities/_base/_collections',
        'entities/_base/_models'
    ],
    function(Backbone, App){

        // Define our Module under App
        var Entities = App.module("Entities");

        Entities.LessonModel = Backbone.Model.extend();

        Entities.Lesson = Entities.Collection.extend({
            model: Entities.LessonModel,
            initialize: function(options) {
                this.debugState = App.request('debug:state');
                this.lessonId = options.lessonId;
                if (!(this.debugState)) {
                    this.isStoredInLocalStorage = true;
                    this.storage = new Offline.Storage('lesson-' + this.lessonId , this);
                } else {
                    this.isStoredInLocalStorage = false;
                    this.url = 'debug-data/lessons/' + this.lessonId + '.json';
                }
            },
            url: function() {
                return 'data/lessons/' + this.lessonId + '.json';
            }
        });

        var API = {
            /*
            ** API Method
            ** Create a collection from a single Lesson model and
            ** return it as a param to the callback function.
            **
            ** @param cb - cb is the callback function that is returned by this API
            ** @param id - id is the id of the lesson we need
            */
            getLessonEntity: function(cb, id) {
                var lesson = new Entities.Lesson({
                    lessonId: id
                });

                lesson.fetch({
                    reset: true,
                    local: lesson.shouldGetLocal(),
                    error: function(args) {
                        console.log(args);
                    },
                    success: function(model, response, options) {
                        if (options.local) {
                            options.complete();
                        }
                    },
                    complete: function() {
                        return cb(lesson.at(0));
                    }
                });
            },
            getPhrasesFromLesson: function(cb, id) {
                // Use the getLessonEntity method to grab our entity,
                // pass a function callback to run once the entities come in
                // manipulate the entites as needed
                // and return the original callback passed in to this method with our manipulated entites as a parameter
                return this.getLessonEntity(function(result) {
                    // grab the 'phrases' from our result entity
                    var phrases = result.get('phrases');

                    // Remove any phrases from this list that are more than 30 characters
                    phrases = _.reject(phrases, function(item) {
                        return item.foreign.length > 30;
                    });

                    // Create a new collection of 5 random phrases
                    phrases = new Backbone.Collection(_.sample(phrases, 5));
                    // Return the passed in callback function passing in our new phrase collection
                    return cb(phrases);
                }, id);
            }
        };

        /*
        ** Setup some handlers for handling requests for these Entities
        **
        ** @example - App.request('lesson:entity', callBackFunction, 4);
        */

        App.reqres.setHandler("lesson:entity", function(cb, id) {
            return API.getLessonEntity(cb, id);
        });

        App.reqres.setHandler('lesson:phrases:entity', function(cb, id) {
            return API.getPhrasesFromLesson(cb, id);
        });

        // Return the module
        return Entities;

    });

}).call(this);
