/**
 * @fileOverview <p>{@link hotdrink.bindings.html.common}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.html.common");

(function () {

  var common = hotdrink.bindings.common;
  var valueB = hotdrink.bindings.behavior.value;
  var enableB = hotdrink.bindings.behavior.enablement;

  var readOnlyBinder = function readOnlyBinder(write) {
    return function (views, model, option) {
      if (hotdrink.isVariable(option)) {
        /* The option is a proxy for a variable or command. */
        ASSERT(typeof option.getMore() !== "undefined",
          "forgot to finish your proxy");
        valueB.bindWrite(model, option, write, views);
      } else {
        /* The option is a constant value. */
        write(views, option);
      }
    };
  };

  var binder = function binder(write, onChange, read, enable, disable) {
    return function (views, model, variable) {
      ASSERT(hotdrink.isVariable(variable),
        "cannot bind an interactive widget to a constant in the model");
      /* The variable is a proxy for a variable or command. */
      ASSERT(typeof variable.getMore() !== "undefined",
        "forgot to finish your getter");
      valueB.bindWrite(model, variable, write, views);
      valueB.bindRead(views, onChange, read, model, variable);
      enableB.bindEnablement(model, variable, enable, disable, views);
    };
  };

  /* NOTE: Intended for a single view. */
  var write = function write(view, value) {
    return $(view).val(value);
  };

  var onChange = function onChange(views, listener) {
    $(views).bind("change click keyup", listener);
  };

  /* NOTE: Intended for a single view. */
  var read = function read(view) {
    return { value : $(view).val() };
  };

  var enable = function enable(views) {
    return $(views).prop("disabled", false);
  };

  var disable = function disable(views) {
    return $(views).prop("disabled", true);
  };

  var bindReadOnly = readOnlyBinder(write);

  var bind = binder(write, onChange, read, enable, disable);

  /* Export: */

  namespace.extend("hotdrink.bindings.html.common", {
    /* Binders: */
    readOnlyBinder : readOnlyBinder,
    binder : binder,
    bindReadOnly : bindReadOnly,
    bind : bind,
    /* Mixins: */
    write : write,
    onChange : onChange,
    read : read,
    enable : enable,
    disable : disable,
    /* Converters and validators: */
    convertNumber : common.convertNumber
  });

}());

