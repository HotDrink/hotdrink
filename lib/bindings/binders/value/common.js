(function () {

  var binder = function binder(options) {

    return function bind(view, variable) {
      ASSERT(hd.isVariable(variable),
        "interactive widgets can bind only to variables");
      hd.bindRead(view, variable, options);
      hd.bindWrite(variable, view, options);
      hd.bindEnablement(variable, view, options);
    };

  };

  var bind = binder();

  /* Export: */

  hd.__private.bindings = {
    binder: binder,
    bind:   bind
  };

}());

