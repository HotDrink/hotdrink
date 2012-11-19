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

  var maybeTranslate = function maybeTranslate(variable, options) {
    if (options.toView || options.toModel || options.validate) {
      if (!hd.isTranslation(variable)) {
        variable = hd.translation(variable);
      }
      if (options.validate) {
        variable.validate.prependOutgoing(options.validate);
      }
      if (options.toModel) {
        variable.validate.prependOutgoing(options.toModel);
      }
      if (options.toView) {
        variable.validate.incoming(options.toView);
      }
    }
    return variable;
  };

  /* Export: */

  hd.__private.bindings = {
    binder:         binder,
    bind:           bind,
    maybeTranslate: maybeTranslate
  };

}());

