(function () {

  var common = hotdrink.bindings.html.common;

  var onChange = function onChange(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    /* keyup instead of keypress, otherwise we'll read the
     * value before the user's edit. */
    view.bind("keyup", listener);
  };

  var setValueUnlessFocused = function setValueUnlessFocused(view, value) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    if (! view.is(document.activeElement))
      $(view).val(value);
    return value;
  }

  var subbindText = common.binder(
    setValueUnlessFocused, onChange, common.getValue, common.toModel, common.validate, common.toViewString, common.enable, common.disable);

  var bindText = function bindText(view, model, binding) {
    var hdtSaved = HOTDRINK_DEBOUNCE_THRESHOLD;

    if (binding.debounce) HOTDRINK_DEBOUNCE_THRESHOLD = binding.debounce;
    subbindText(view, model, binding);

    HOTDRINK_DEBOUNCE_THRESHOLD = hdtSaved;
  };

  namespace.extend("hotdrink.bindings.html", {
    bindText: bindText,
    bindLabel: common.readOnlyBinder(
      function write(view, value) {
        ASSERT(view instanceof jQuery, "expected jQuery object");
        if (typeof value !== "string") value = JSON.stringify(value);
        view.text(value);
        return {value: value};
      })
  });

}());

