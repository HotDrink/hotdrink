(function () {

  var common = hotdrink.bindings.common;
  var valueB = hotdrink.bindings.behavior.value;
  var enableB = hotdrink.bindings.behavior.enablement;

  var readOnlyBinder = function readOnlyBinder(write) {

    return function bind(view, option) {
      if (hotdrink.isProxy(option)) {
        /* The option is a proxy for a variable or command. */
        valueB.bindWrite(option, write, view);
      } else {
        /* The option is a constant value. */
        write(view, option);
      }
    };

  };

  var binder = function binder(write, onChange, read, enable, disable) {

    return function (view, variable) {
      ASSERT(hotdrink.isVariable(variable),
        "interactive widgets can bind only to variables");
      /* The variable is a proxy for a variable or command. */
      valueB.bindWrite(variable, write, view);
      valueB.bindRead(view, onChange, read, variable);
      enableB.bindEnablement(variable, enable, disable, view);
    };

  };

  /* NOTE: Intended for a single view. */
  var write = function write(view, value) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return view.val(value);
  };

  var onChange = function onChange(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    view.bind("change click keyup", listener);
  };

  /* NOTE: Intended for a single view. */
  var read = function read(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return { value: view.val() };
  };

  var enable = function enable(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return view.prop("disabled", false);
  };

  var disable = function disable(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return view.prop("disabled", true);
  };

  var bindReadOnly = readOnlyBinder(write);

  var bind = binder(write, onChange, read, enable, disable);

  /* Export: */

  namespace.extend("hotdrink.bindings.html.common", {
    /* Binders: */
    readOnlyBinder: readOnlyBinder,
    binder:         binder,
    bindReadOnly:   bindReadOnly,
    bind:           bind,
    /* Mixins: */
    write:          write,
    onChange:       onChange,
    read:           read,
    enable:         enable,
    disable:        disable,
    /* Converters and validators: */
    convertNumber:  common.convertNumber
  });

}());

