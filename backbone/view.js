(function() {

    define([
        'backbone.marionette',
        'app',
        'templates'
    ],
    function(Marionette, App, templates){

        var parentViewId;

        // Define our HomeApp.List Sub Module under App
        var List = App.module("LessonApp.LearnApp.StructureApp.List");

        List.StructureItem = Backbone.Marionette.ItemView.extend({
            template: templates.lesson.learn.item,
            className: function() {
                var classes = 'step';

                classes = classes + ' ' + this.model.get('type');

                return classes;
            },
            initialize: function() {
                var self = this;
                self.foreignSound = this.model.get('audio');
                // listen for the 'show:item' event to come down from the top and act accordingly
                self.listenTo(self.model, 'show:item', self.itemActive);
            },
            events: {
                'tap button': 'playItem'
            },
            playItem: function() {
                var self = this;

                if (App.request('narration:state')) {
                    App.trigger('narration:stop:buffer', parentViewId);
                    App.trigger('narration:toggle', {
                        persistent: false
                    });
                } else {
                    App.trigger('narration:toggle:content');
                }

                App.trigger('media:play:sound', self.foreignSound);
            },
            itemActive: function() {
                this.$el.addClass('active');
            }
        });

        List.StructurePage = Backbone.Marionette.CompositeView.extend({
            template: templates.lesson.learn.structurePage,
            itemView: List.StructureItem,
            itemViewContainer: '.items',
            className: 'structure page',
            initialize: function() {
                var self = this;

                this.listenTo(this.model, 'show:item', function(index) {
                    self.collection.at(index).trigger('show:item'); //Trigger the 'show:item' event on the structure item model at the given index
                });

                // Handling nested CompositeView here
                // http://stackoverflow.com/a/13595115/998352
                var ItemModel = Backbone.Model.extend();
                var ItemCollection = Backbone.Collection.extend({
                    model: ItemModel
                });
                this.items = new ItemCollection(this.model.get('items'));
                this.collection = this.items;

                this.listenTo(App, 'narration:toggle:content:all', this.narrationToggleContentAll);

                this.on('slide:show', function(e) {
                    List.trigger('slide:show');

                    App.reqres.setHandler('narration:view:id', function() {
                        return parentViewId;
                    });
                    self.listenTo(App, 'narration:stop:buffer', self.inactivateItems);
                    self.listenTo(App, 'narration:toggle', self.narrationToggle);
                    self.listenTo(App, 'narration:toggle:content', self.narrationToggle);
                    self.listenTo(App, 'lesson:next', self.handleNext);
                    self.listenTo(App, 'lesson:previous', self.handlePrev);

                    // Setup the viewID to this view's cid
                    parentViewId = self.cid;

                    //Show the previous button
                    App.trigger('lesson:previous:toggle', true);

                    self.buildNarration();

                    if (App.request('narration:state', true)) {
                        self.$el.addClass('narration-on');
                        _.defer(function() {
                            App.trigger('narration:play:buffer', parentViewId);
                        });
                    } else {
                        self.$el.removeClass('narration-on');
                    }

                });

                this.on('slide:hide', function() {
                    // Emit an event on the entire List object so, other views on it can listen
                    List.trigger('slide:hide');

                    if (App.request('narration:state', true)) {
                        App.trigger('narration:stop:buffer', parentViewId);
                    }

                    // Clear the buffer for this viewId
                    App.request('narration:clear:buffer', parentViewId);

                    App.reqres.removeHandler('narration:view:id');
                    // Stop listening to events on App from this view object
                    self.stopListening(App, 'narration:stop:buffer');
                    self.stopListening(App, 'narration:toggle');
                    self.stopListening(App, 'narration:toggle:content');
                    self.stopListening(App, 'lesson:next');
                    self.stopListening(App, 'lesson:previous');

                });
            },
            narrationToggleContentAll: function() {
                this.$el.toggleClass('narration-on');
            },
            narrationToggle: function() {
                var narrationState = App.request('narration:state');
                var self = this;

                if (narrationState) {

                    this.$el.addClass('narration-on');
                    App.trigger('narration:play:buffer', parentViewId);

                } else {
                    this.$el.removeClass('narration-on');
                    App.trigger('narration:stop:buffer', parentViewId);
                }
            },
            buildNarration: function() {
                var model = this.model;
                var self = this;

                parentViewId = this.cid;

                _.each(model.get('items'), function(item, index) {
                    item.type = item.type;
                    item.foreignSound = item.audio || null;
                    item.nativeSound = item.audio_native || null;

                    switch (item.type) {
                        case 'text':
                            // Create the sound(s) that we need for this item
                            App.trigger('media:create:sound', item.foreignSound);

                            // Create the bufferObj needed for the narration buffer
                            // @function step - the narration tasks for this step in naration
                            // @function stop - the tasks needed to stop narration if it's stopped on this step
                            var bufferObj = {
                                step: function(dfd) {
                                    model.trigger('show:item', index); // Trigger the 'show:item' event on the page model; The page model will then trigger the event on the proper structure item model
                                    App.trigger('media:play:sound', item.foreignSound, {
                                        onfinish: function() {
                                            dfd.resolve();
                                        }
                                    });
                                },
                                stop: function() {
                                    App.trigger('media:stop:sound', item.foreignSound);
                                },
                                foreignSound: item.foreignSound,
                                nativeSound: item.nativeSound
                            };

                            App.trigger('narration:addTo:buffer', bufferObj, parentViewId);

                            // Handling sounds inside the switch so we don't have
                            // to repeat all these switch statements in a new method method
                            self.listenTo(App, 'views:destroy:sounds', function() {
                                App.trigger('media:stop:sound', item.foreignSound);
                                App.trigger('media:destroy:sound', item.foreignSound);
                            });

                        break;
                        case 'bullet':

                            App.trigger('media:create:sound', item.foreignSound);

                            var bufferObj = {
                                step: function(dfd) {
                                    model.trigger('show:item', index);
                                    App.trigger('media:play:sound', item.foreignSound, {
                                        onfinish: function() {
                                            dfd.resolve();
                                        }
                                    });
                                },
                                stop: function() {
                                    App.trigger('media:stop:sound', item.foreignSound);
                                },
                                foreignSound: item.foreignSound,
                                nativeSound: item.nativeSound
                            };

                            App.trigger('narration:addTo:buffer', bufferObj, parentViewId);

                            self.listenTo(App, 'views:destroy:sounds', function() {
                                App.trigger('media:stop:sound', item.foreignSound);
                                App.trigger('media:destroy:sound', item.foreignSound);
                            });

                        break;
                        case 'audio':

                            App.trigger('media:create:sound', item.foreignSound);

                            var bufferObj = {
                                step: function(dfd) {
                                    App.trigger('media:play:sound', item.foreignSound, {
                                        onfinish: function() {
                                            dfd.resolve();
                                        }
                                    });
                                },
                                stop: function() {
                                    App.trigger('media:stop:sound', item.foreignSound);
                                },
                                foreignSound: item.foreignSound,
                                nativeSound: item.nativeSound
                            };

                            App.trigger('narration:addTo:buffer', bufferObj, parentViewId);

                            self.listenTo(App, 'views:destroy:sounds', function() {
                                App.trigger('media:stop:sound', item.foreignSound);
                                App.trigger('media:destroy:sound', item.foreignSound);
                            });

                        break;
                        case 'target':

                            App.trigger('media:create:sound', item.foreignSound);

                            //Disabling target until audio filename issues are resolved.
                            var bufferObj = {
                                step: function(dfd) {
                                    model.trigger('show:item', index);
                                    App.trigger('media:play:sound', item.foreignSound, {
                                        onfinish: function() {
                                            dfd.resolve();
                                        }
                                    });
                                },
                                foreignSound: item.foreignSound,
                                nativeSound: item.nativeSound
                            };

                            App.trigger('narration:addTo:buffer', bufferObj, parentViewId);

                            self.listenTo(App, 'views:destroy:sounds', function() {
                                App.trigger('media:stop:sound', item.foreignSound);
                                App.trigger('media:destroy:sound', item.foreignSound);
                            });

                        break;
                        case 'pause':

                            var bufferObj = {
                                step: function(dfd) {
                                    var time = parseInt(item.length);
                                    _.delay(function() {
                                        dfd.resolve(); // simply, resolve the deferred object after the 'time' delay
                                    }, time);
                                },
                                stop: function() {
                                    return;
                                },
                                foreignSound: item.foreignSound,
                                nativeSound: item.nativeSound
                            };

                            App.trigger('narration:addTo:buffer', bufferObj, parentViewId);

                        break;
                        case 'trans':

                            App.trigger('media:create:sound', item.foreignSound);

                            var bufferObj = {
                                step: function(dfd) {
                                    model.trigger('show:item', index);
                                    App.trigger('media:play:sound', item.foreignSound, {
                                        onfinish: function() {
                                            dfd.resolve();
                                        }
                                    });
                                },
                                foreignSound: item.foreignSound,
                                nativeSound: item.nativeSound
                            };

                            App.trigger('narration:addTo:buffer', bufferObj, parentViewId);

                            self.listenTo(App, 'views:destroy:sounds', function() {
                                App.trigger('media:stop:sound', item.foreignSound);
                                App.trigger('media:destroy:sound', item.foreignSound);
                            });

                        break;
                        default:

                            console.log('This "type" has not been accounted for. See structure list_view.js');

                        break;
                    } //end switch (this.type)

                });
            },
            handleNext: function() {
                App.trigger('lesson:learn:goTo:next');
            },
            handlePrev: function() {
                App.trigger('lesson:learn:goTo:prev');
            },
            onRender: function() {
                this.formatText();
            },
            onShow: function() {
                this.$slideEl = this.$el.parent();
            },
            onBeforeClose: function() {
                this.off('slide:show');
                this.off('slide:hide');
            },
            inactivateItems: function() {
                this.$el.find('.step.active').removeClass('active');
            },

            /* The purpose of this function is to dynamically format text on the fly
            ** We don't always know the order in which type 'target' and 'type' trans will be displayed,
            ** and there is nothing in the data indicating we should treat one target type differently from the other,
            ** so we must loop through them dynamically.
            **
            */
            formatText: function() {
                var self = this;
                var models = self.items.models;
                var $steps = self.$el.find('.items .step');

                // Loop through all the models, running the following on each one
                _.each(models, function(item, index) {
                    // If type === target,
                    // look for the models after target, and act accordingly
                    if (item.attributes.type === 'target' && item.skip !== true) {

                        // After target is found, return the rest of the models after it, so
                        // they can be examined
                        var modelsAfter = _.rest(models, index+1);

                        // Look through the rest of the models using find,
                        // returning from the find loop when we come across
                        // models that are not hidden or 'trans'
                        // We use _.find method here becuase it gives us the ability to return true;
                        // out of the loop.
                        _.find(modelsAfter, function(afterItem, afterIndex) {
                            var type = afterItem.attributes.type;
                            if (type === 'audio' || type === 'pause') return false; // Do nothing, but continue when we come across type: audio
                            else if (type === 'trans') {
                                afterItem.skip = true; //Adding a skip flag to this item so it won't be checked again by other if statements
                                return true;
                            }

                            // With the following types, we would like to break from the _.find
                            // without doing anything, becuase we now know one of these types follows.
                            else if (type === 'text' || type === 'bullet' || type === 'target') {
                                // Add class to orginal type: target element from _.each loop above
                                // becuase we now know a type trans, DOES NOT this 'target'
                                var $targetEl = $steps.eq(index);
                                // var $transEl = $steps.eq(index+afterIndex);
                                $targetEl.addClass('no-trans');
                                return true;
                            }
                        });

                    } else if ((item.attributes.type === 'trans') && item.skip !== true) {

                        // After target is found, return the rest of the models after it, so
                        // they can be examined
                        var modelsAfter = _.rest(models, index+1);

                        // Look through the rest of the models using find,
                        // returning from the find loop when we come across
                        // models that are not hidden or 'trans'
                        // We use _.find method here becuase it gives us the ability to return true;
                        // out of the loop.
                        _.find(modelsAfter, function(afterItem, afterIndex) {
                            var type = afterItem.attributes.type;
                            if (type === 'audio' || type === 'pause') return false; // Do nothing, but continue when we come across type: audio
                            else if (type === 'text' || type === 'bullet' || type === 'trans') return true;

                            // With the following types, we would like to break from the _.find
                            // without doing anything, becuase we now know one of these types follows.
                            else if (type === 'target') {
                                afterItem.skip = true; //Adding a skip flag to this item so it won't be checked again by other if statements
                                // Add class to orginal type: target element from _.each loop above
                                // becuase we now know a type trans, DOES NOT this 'target'
                                var $transEl = $steps.eq(index);
                                var $targetEl = $steps.eq(index+afterIndex+1);
                                $targetEl.addClass('trans-first');
                                $transEl.addClass('trans-first');
                                return true;
                            }
                        });

                    }

                });
            }
        });

        // Return the module
        return List;

    });

}).call(this);
