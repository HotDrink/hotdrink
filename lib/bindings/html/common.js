(function () {

  var valueB  = hotdrink.bindings.behavior.value;
  var enableB = hotdrink.bindings.behavior.enablement;

  var readOnlyBinder = function readOnlyBinder(write) {

    return function bind(view, option) {
      valueB.bindWrite(option, view, { write: write });
    };

  };

  var binder = function binder(options) {

    return function bind(view, variable) {
      ASSERT(hotdrink.isVariable(variable),
        "interactive widgets can bind only to variables");
      valueB.bindRead(view, variable, options);
      valueB.bindWrite(variable, view, options);
      enableB.bindEnablement(variable, view, options);
    };

  };

  var bindReadOnly = readOnlyBinder();
  var bind         = binder();

  /* Export: */

  namespace.extend("hotdrink.bindings.html.common", {
    /* Binders: */
    readOnlyBinder: readOnlyBinder,
    binder:         binder,
    bindReadOnly:   bindReadOnly,
    bind:           bind,
  });

}());

