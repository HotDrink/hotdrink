/**
 * @fileOverview <p>{@link hotdrink.bindings.html.common}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.html.common");

(function () {

  var common = hotdrink.bindings.common;
  var valueB = hotdrink.bindings.behavior.value;
  var enableB = hotdrink.bindings.behavior.enablement;

  var makeRead = function makeRead(getValue, toModel, validate) {
    return function (view) {
      var viewValue = getValue(view);

      var modelValue = toModel(viewValue)
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

  var makeWrite = function makeWrite(setValue, toView) {
    return function (view, val) {
      var viewValue = toView(val);
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

    var binder = function binder(setValue, onChange, getValue, defaultToModel, defaultValidate, defaultToView, enable, disable) {
    return function (views, model, binding) {
      var variable = binding.value;
      ASSERT(hotdrink.isVariable(variable),
        "cannot bind an interactive widget to a constant in the model");
      /* The variable is a proxy for a variable or command. */
      ASSERT(typeof variable.getMore() !== "undefined",
        "forgot to finish your getter");
      var read = makeRead(getValue,
                          binding.toModel ? binding.toModel : defaultToModel,
                          binding.validate ? binding.validate : defaultValidate);
      var write = makeWrite(setValue,
                            binding.toView ? binding.toView : defaultToView);
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

  var toModel = function toModel(value) {
    return { value: value };
  };

  var validate = function validate(value) {
    return {};
  };

  var toView = function toView(value) {
    return { value: value };
  };

  var toViewString = function toViewString(value) {
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

  var bindReadOnly = function bindReadOnly (setValue, toView) {
    var write = makeWrite(setValue, toView)
    readOnlyBinder(write);
  };

  var bind = binder(setValue, onChange, getValue, toModel, validate, toViewString, enable, disable);

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
    toModel: toModel,
    validate : validate,
    toView : toView,
    toViewString : toViewString,
    enable : enable,
    disable : disable,
    /* Converters and validators: */
    numberToString : common.numberToString
  });

}());

