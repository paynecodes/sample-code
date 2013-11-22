# Sample Code

The [backbone folder](backbone) contains some code I wrote a while back. I'll do my best to provide some context. This application is a Single Page JavaScript application utilizing  [Backbone](http://backbonejs.org/), [Marionette](http://marionettejs.com/), [RequireJS](http://requirejs.org/), among many other libraries like any other application of this scale.

1. [module.js](backbone/module.js) defines the module (actually a sub-module), its' dependencies, routes, a routing API object, and messaging events.

2. [controller.js](backbone/controller.js) is pretty simple in this scenario (perhaps I should have picked a more complex controller, but, then again, this should be easy to consume). Basically, it defines a `listStructure` method on the `List.Controller`. The details of this method aren't all that important or easy to follow without more context, but basically, I needed to setup a deferred object, and jump to a particular "slide" after that deferred object is resolved.

3. [view.js](backbone/view.js) is quite complex, so I'll briefly explain the basics. A collection is passed to the `CompositeView` defined as `List.StructurePage`, and Marionette provides a nice construct for rendering models in an `ItemView` defined as `List.StructureItem`. There are a ton of events both emitted and received in this view. Unfortunately, I don't have control over the data coming in from the JSON API, so I've got to do some pretty awkward manipulation with it, and elected to do it in the view here.

4. [entity.js](backbone/entity.js) is responsible for returning Models and Collection from the JSON API. Also, I am caching this long-lived data in `localStorage`, but those implementation details are abstracted in the base collection referenced in the RequireJS block, `entities/_base/_collections`.

5. [custom_backbone_marionette_transition_region.js](backbone/custom_backbone_marionette_transition_region.js) and [transition_adapter.js](backbone/transition_adapter.js) are just there, so you can take a look at how I implemented hardware accelereated page transitions between views.