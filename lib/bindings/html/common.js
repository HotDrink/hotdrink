(function () {

  var readOnlyBinder = function readOnlyBinder(write) {

    return function bind(view, option) {
      hd.bindWrite(option, view, { write: write });
    };

  };

  var binder = function binder(options) {

    return function bind(view, variable) {
      ASSERT(hd.isVariable(variable),
        "interactive widgets can bind only to variables");
      hd.bindRead(view, variable, options);
      hd.bindWrite(variable, view, options);
      hd.bindEnablement(variable, view, options);
    };

  };

  var bindReadOnly = readOnlyBinder();
  var bind         = binder();

  /* Export: */

  hd.__private.bindings = {
    readOnlyBinder: readOnlyBinder,
    binder:         binder,
    bindReadOnly:   bindReadOnly,
    bind:           bind
  };

}());

