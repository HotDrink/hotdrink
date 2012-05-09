(function () {

  var defaults = {};

  defaults.enable = function enable(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return view.prop("disabled", false);
  };

  defaults.disable = function disable(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return view.prop("disabled", true);
  };

  var bindEnablement = function bindEnablement(variable, view, options) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hotdrink.isProxy(variable), "expected proxy");

    options     = options || {};
    var enable  = options.enable  || defaults.enable;
    var disable = options.disable || defaults.disable;

    var listener = function enableListener(canBeDisabled) {
      if (canBeDisabled) {
        LOG("disabling #" + view.attr("id"));
        disable(view);
      } else {
        LOG("enabling #" + view.attr("id"));
        enable(view);
      }
    };

    variable.subscribe("canBeDisabled", listener);
    listener();
  };

  /**
   * @name hotdrink.controller.behavior.enablement
   * @namespace
   *   Support enablement and disablement of widgets. Model of
   *   {@link concept.view.Behavior}.
   */
  namespace.extend("hotdrink.bindings.behavior.enablement", {
    bindEnablement: bindEnablement
  });

}());

