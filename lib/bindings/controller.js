/**
 * @fileOverview <p>{@link hotdrink.bindings.Controller}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.Controller");

(function () {

  var Controller = function Controller() {
    this.binders = {};
    this.bindings = {};
    this.bindingCount = 0;
  };

  /* A binder takes a DOM element, a model, and some options. */
  /* @param binders Map from names to binders. */
  Controller.prototype.extend = function extend(newBinders) {
    Object.extend(this.binders, newBinders);
  };

  /* Views in all contexts should be considered of unknown type, but eligible as
   * an argument for $(). */
  Controller.prototype.bind = function bind(views, model) {
    var self = this;
    views = $(views);

    /* For each bound view, ... */
    views.each(function () {
      LOG("Trying to bind #" + $(this).attr("id"));

      /* Parse its bindings string. */
      var bindingString = $(this).attr("data-bind");

      /* Credit to Knockout.js for this. */
      var functionBody = "with (model) { return ({ " + bindingString + " }); } ";
      LOG("functionBody = " + functionBody);
      try {
        var bindingMonad = new Function("model", functionBody);
      } catch (e) {
        ERROR("expected execution (not construction) of function to throw");
      }

      /* bindings is an object mapping a name of a binder to the value of its
       * options. In the context of the options:
       *
       * - Constants and expressions have already been evaluated.
       * - A variable reference (as opposed to value) will be represented by
       *   its getter-setter from the model.
       * - This means we cannot yet bind to an expression. To do so will
       *   require parsing the bindingString ourselves, or (like Knockout)
       *   storing the bindingMonad for re-evaluation whenever the model
       *   changes.
       */
      try {
        var bindings = bindingMonad(model);
      } catch (e) {
        var id = $(this).attr("id");
        ERROR("cannot parse bindings on " +
              (id ? ("#" + id) : "(unidentified element)") + ":\n  \"" +
              bindingString + "\"\n  " +
              e);
        return;
      }

      /* For each binding, call the named binder. */
      var elt = this;
      Object.keys(bindings).forEach(function (binderName) {
        var binder = self.binders[binderName];
        if (!binder) {
          ERROR("No binder for " + binderName);
          return;
        }
        var binding = self.constructBinding(bindings[binderName]);
        self.bindings[binding.id] = binding;
        binder(elt, model, binding, self);
      });
    });
  };

  Controller.prototype.subscribeToError = function subscribeToError(id, write, view) {
    ASSERT(id in this.bindings, "unkown id for binding");
    this.bindings[id].subscribers.push({write: write, view: view});
  }

  Controller.prototype.setErrorForBinding = function setErrorForBinding(id, message) {
    ASSERT(id in this.bindings, "unknown id for binding");
    this.bindings[id].error = message;
    var subscribers = this.bindings[id].subscribers;
    for (var i = 0; i < subscribers.length; ++i)
      subscribers[i].write(subscribers[i].view, message);
  }

  Controller.prototype.constructBinding = function constructBinding(options) {
    var binding;
    if (typeof options == "object")
      binding = options;
    else
      binding = {value: options};

    if (!("id" in binding))
      binding.id = "binding"+(++this.bindingCount);
    binding.subscribers = [];
    binding.error = '';
    return binding;
  }

  namespace.open("hotdrink.bindings").Controller = Controller;

}());

