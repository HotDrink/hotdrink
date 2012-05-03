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
  Controller.prototype.bindAny = function bindAny(view, bindings, context) {
    var doNotRecurse = false;

    /* For each binding, call the named binder. */
    Object.keys(bindings).forEach(function (binderName) {
      var binder = this.binders[binderName];

      if (!binder) {
        ERROR("No binder for " + binderName);
        return;
      }

      if (binder.call(this, view, bindings[binderName], context)) {
        doNotRecurse = true;
      }
    }, this);

    return doNotRecurse;
  };

  /* @returns {Boolean}
   *   True if we should not recurse into the view's descendants, e.g., in
   *   the presence of a binder like foreach that handles the binding of
   *   descendants.
   */
  Controller.prototype.bindElement = function bindElement(elt, context) {
    ASSERT(elt instanceof jQuery, "expected jQuery object");
    ASSERT(elt.length === 1, "expected a single element");
    LOG("Trying to bind #" + elt.attr("id"));

    /* Parse its bindings string. */
    var bindingString = elt.attr("data-bind");
    if (!bindingString) return false;

    /* Credit to Knockout.js for this. */
    var functionBody = "with ($context) { return ({ " + bindingString + " }); } ";
    LOG("functionBody = " + functionBody);
    try {
      var bindingMonad = new Function("$context", functionBody);
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
      var bindings = bindingMonad(context);
    } catch (e) {
      var id = elt.attr("id");
      ERROR("cannot parse bindings on " +
            (id ? ("#" + id) : "(unidentified element)") + ":\n  \"" +
            bindingString + "\"\n  " +
            e);
      return true;
    }

    /* Built-in binders expect jQuery objects. */
    return this.bindAny(elt, bindings, context);
  };

  var Context = function Context($this, $parent) {
    if (typeof $this === "object") {
      Object.keys($this).forEach(function (key) {
        this[key] = $this[key];
      }, this);
    }

    this.$this = $this;

    if ($parent) {
      this.$parent = $parent;
      this.$parents = $parent.$parents.slice();
      this.$parents.push($parent);
    } else {
      this.$root = $this;
      this.$parents = [];
    }
  };

  Controller.prototype.bindTree = function bindTree(elts, context) {
    ASSERT(elts instanceof jQuery, "expected jQuery object");
    var self = this;
    elts.each(function () {
      var elt = $(this);
      if (self.bindElement(elt, context)) return;
      self.bindTree(elt.children(), context);
    });
  };

  /* @param parent {Context}
   *   Hidden parameter. Passed only during recursion.
   */
  Controller.prototype.bindDeclarative
    = function bindDeclarative(elts, value, parent)
  {
    var context = new Context(value, parent);
    this.bindTree(elts, context);
  };

  namespace.open("hotdrink.bindings").Controller = Controller;

}());

