/**
 * @fileOverview <p>{@link hotdrink.bindings.html.common}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.html.common");

(function () {

  var common = hotdrink.bindings.common;
  var valueB = hotdrink.bindings.behavior.value;
  var enableB = hotdrink.bindings.behavior.enablement;

  var makeFn = function makeFn(body, defaultFn) {
    var fn = defaultFn;
    if (body) {
      var fullBody = "with (model) { return (" + body + "); }";
      try {
        fn = new Function("value", fullBody);
      } catch (e) {
        ERROR("unable to make function from: \"" + body + "\"");
      }
    }
    return fn;
  }

  var makeRead = function makeRead(getValue, convert, validate) {
    return function (view) {
      var viewValue = getValue(view);

      var modelValue = convert(viewValue)
      if ("value" in modelValue) {
        var validated = validate(modelValue.value);
        if (typeof validated == "boolean") {
          if (validated) {
            return modelValue;
          } else {
            return { error: "Invalid value" };
          }
        } else {
          return { error: validated.toString() };
        }
      } else {
        return modelValue;
      }
    };
  }

  var readOnlyBinder = function readOnlyBinder(write) {
    return function (views, model, binding) {
      var value = binding.value;
      if (hotdrink.isVariable(value)) {
        /* The value is a proxy for a variable or command. */
        ASSERT(typeof value.getMore() !== "undefined",
          "forgot to finish your proxy");
        valueB.bindWrite(model, value, write, views);
      } else {
        /* The value is a constant value. */
        write(views, value);
      }
    };
  };

  var binder = function binder(write, onChange, getValue, defaultConvert, defaultValidate, enable, disable) {
    return function (views, model, binding, controller) {
      var variable = binding.value;
      ASSERT(hotdrink.isVariable(variable),
        "cannot bind an interactive widget to a constant in the model");
      /* The variable is a proxy for a variable or command. */
      ASSERT(typeof variable.getMore() !== "undefined",
        "forgot to finish your getter");
      var read = makeRead(getValue,
                          binding.convert ? binding.convert : defaultConvert,
                          binding.validate ? binding.validate : defaultValidate);
      valueB.bindWrite(model, variable, write, views);
      valueB.bindRead(views, onChange, read, model, variable, binding, controller);
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
  var getValue = function getValue(view) {
    return $(view).val();
  };

  var convert = function convert(value) {
    return { value: value };
  }

  var validate = function validate(value) {
    return true;
  }

  var enable = function enable(views) {
    return $(views).prop("disabled", false);
  };

  var disable = function disable(views) {
    return $(views).prop("disabled", true);
  };

  var bindReadOnly = readOnlyBinder(write);

  var bind = binder(write, onChange, getValue, convert, validate, enable, disable);

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
    getValue: getValue,
    convert: convert,
    validate: validate,
    enable : enable,
    disable : disable,
    /* Converters and validators: */
    convertNumber : common.convertNumber
  });

}());

