/**
 * @fileOverview <p>{@link hotdrink.bindings.Controller}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.Controller");

(function () {

  var Controller = function Controller() {
    this.binders = {};
  };

  /* A binder takes a DOM element, a model, and some options. */
  /* @param binders Map from names to binders. */
  Controller.prototype.extend = function extend(newBinders) {
    Object.extend(this.binders, newBinders);
  };

  /* @param view {View}
   *   The binders should know the concrete type, but for this function to be
   *   generic for both DOM elements and third-party widgets, the view must
   *   be abstract here.
   * @returns {Boolean}
   *   True if any of the binders return a truthy value. This feature is used
   *   by the default binding system to stop recursion into the descendants
   *   of a view.
   */
  Controller.prototype.bindAny = function bindAny(view, bindings) {
    /* For each binding, call the named binder. */
    var doNotRecurse = false;
    Object.keys(bindings).forEach(function (binderName) {
      var binder = this.binders[binderName];
      if (!binder) {
        ERROR("No binder for " + binderName);
        return;
      }
      if (binder(view, bindings[binderName])) doNotRecurse = true;
    }, this);
    return doNotRecurse;
  }


  /* @returns {Boolean}
   *   True if we should not recurse into the view's descendants, e.g., in
   *   the presence of a binder like foreach that handles the binding of
   *   descendants.
   */
  Controller.prototype.bindElement = function bindElement(view, model) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    LOG("Trying to bind #" + view.attr("id"));

    /* Parse its bindings string. */
    var bindingString = view.attr("data-bind");
    if (!bindingString) return false;

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
     *   its proxy.
     * - This means we cannot yet bind to an expression. One option is to
     *   copy Knockout:
     *   1. Parse binding string as an object literal.
     *   2. For each property,
     *      2.a. Wrap the value (an expression) inside a computed variable.
     *      2.b. Pass the computed variable to the binder named by the key.
     */
    try {
      var bindings = bindingMonad(model);
    } catch (e) {
      var id = view.attr("id");
      ERROR("cannot parse bindings on " +
            (id ? ("#" + id) : "(unidentified element)") + ":\n  \"" +
            bindingString + "\"\n  " +
            e);
      return true;
    }

    /* Built-in binders expect jQuery objects. */
    return this.bindAny(view, bindings);
  };

  Controller.prototype.bind = function bind(view, model) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(view.length === 1, "expected a single element");

    if (this.bindElement(view, model)) return;

    var self = this;
    view.children().each(function () {
      self.bind($(this), model);
    });
  };

  namespace.open("hotdrink.bindings").Controller = Controller;

}());

