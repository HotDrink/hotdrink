(function () {

  /* Default runtime. */
  window.hd = new hotdrink.model.Factory();

  /* Default behaviors. */
  hd.behavior(new hotdrink.model.behavior.Precondition());
  hd.behavior(new hotdrink.model.behavior.Enablement());

  /* Default binders. */
  var bindController = new hotdrink.bindings.Controller();
  hotdrink.bindings.html.extend(bindController.binders);

  /* Have to take our parameters in the wrong conceptual order because we
   * have a default for the view. */
  var bind = function bind(model, view) {
    if (!view) view = $('body');
    if (!(view instanceof jQuery)) view = $(view);
    LOG("Binding " + view.attr("id"));
    bindController.bind(view, model);
  };

  /**
   * @name hotdrink
   * @namespace Top-level library namespace.
   */
  namespace.extend("hotdrink", {
    bind: bind,
    /* Expose the binders dictionary for extension. */
    binders: bindController.binders
  });

}());

