(function () {

  var defaults = {};

  defaults.enable = function enable(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    LOG("enabling #" + view.attr("id"));
    return view.prop("disabled", false);
  };

  defaults.disable = function disable(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    LOG("disabling #" + view.attr("id"));
    return view.prop("disabled", true);
  };

  var bindEnablement = function bindEnablement(variable, view, options) {
    ASSERT(hd.isProxy(variable), "expected proxy");

    options     = options || {};
    var enable  = options.enable  || defaults.enable;
    var disable = options.disable || defaults.disable;

    var listener = function enableListener(canBeDisabled) {
      if (canBeDisabled) {
        disable(view);
      } else {
        enable(view);
      }
    };

    variable.subscribe("canBeDisabled", listener);
    listener(variable.unwrap().canBeDisabled);
  };

  hd.bindEnablement = bindEnablement;

}());

