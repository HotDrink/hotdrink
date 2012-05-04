/**
 * @fileOverview <p>{@link hotdrink.bindings.html.common}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.html.common");

(function () {

  var common = hotdrink.bindings.common;
  var valueB = hotdrink.bindings.behavior.value;
  var enableB = hotdrink.bindings.behavior.enablement;

  var makeRead = function makeRead(getValue, convert, validate) {
    return function (view) {
      var viewValue = getValue(view);

      var modelValue = convert(viewValue)
      if ("value" in modelValue) {
        var validation = validate(modelValue.value);
        if (validation && "error" in validation) {
          return validation;
        }
        else {
          return modelValue;
        }
      }
      else {
        return modelValue;
      }
    };
  }

  var makeWrite = function makeWrite(setValue, convertBack) {
    return function (view, val) {
      var viewValue = convertBack(val);
      if ("value" in viewValue)
        setValue(view, viewValue.value);
      return viewValue;
    };
  }

  var readOnlyBinder = function readOnlyBinder(write) {
    return function (views, model, binding) {
      var value = binding.value;
      if (hotdrink.isVariable(value)) {
        /* The value is a proxy for a variable or command. */
        ASSERT(typeof value.getMore() !== "undefined",
          "forgot to finish your proxy");
        valueB.bindWrite(model, value, write, views, binding);
      } else {
        /* The value is a constant value. */
        write(views, value);
      }
    };
  };

    var binder = function binder(setValue, onChange, getValue, defaultConvert, defaultValidate, defaultConvertBack, enable, disable) {
    return function (views, model, binding) {
      var variable = binding.value;
      ASSERT(hotdrink.isVariable(variable),
        "cannot bind an interactive widget to a constant in the model");
      /* The variable is a proxy for a variable or command. */
      ASSERT(typeof variable.getMore() !== "undefined",
        "forgot to finish your getter");
      var read = makeRead(getValue,
                          binding.convert ? binding.convert : defaultConvert,
                          binding.validate ? binding.validate : defaultValidate);
      var write = makeWrite(setValue,
                            binding.convertBack ? binding.convertBack : defaultConvertBack);
      valueB.bindWrite(model, variable, write, views, binding);
      valueB.bindRead(views, onChange, read, model, variable, binding);
      enableB.bindEnablement(model, variable, enable, disable, views);
    };
  };

  /* NOTE: Intended for a single view. */
  var setValue = function setValue(view, value) {
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
  };

  var validate = function validate(value) {
    return {};
  };

  var convertBack = function convertBack(value) {
    return { value: value };
  };

  var convertBackToString = function convertBackToString(value) {
    if (value === undefined || value === null)
      return { value: "" };
    else
      return { value:value.toString() };
  }

  var enable = function enable(views) {
    return $(views).prop("disabled", false);
  };

  var disable = function disable(views) {
    return $(views).prop("disabled", true);
  };

  var bindReadOnly = function bindReadOnly (setValue, convertBack) {
    var write = makeWrite(setValue, convertBack)
    readOnlyBinder(write);
  };

  var bind = binder(setValue, onChange, getValue, convert, validate, convertBackToString, enable, disable);

  /* Export: */

  namespace.extend("hotdrink.bindings.html.common", {
    /* Binders: */
    readOnlyBinder : readOnlyBinder,
    binder : binder,
    bindReadOnly : bindReadOnly,
    bind : bind,
    /* Mixins: */
    setValue : setValue,
    onChange : onChange,
    getValue : getValue,
    convert: convert,
    validate : validate,
    convertBack : convertBack,
    convertBackToString : convertBackToString,
    enable : enable,
    disable : disable,
    /* Converters and validators: */
    convertNumber : common.convertNumber
  });

}());

