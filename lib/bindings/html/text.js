(function () {

  var common = hotdrink.bindings.html.common;

  var onChange = function onChange(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    /* keyup instead of keypress, otherwise we'll read the
     * value before the user's edit. */
    view.bind("keyup", listener);
  };

  var subbindText = common.binder(
    common.write, onChange, common.read, common.enable, common.disable);

  var bindText = function bindText(view, options) {
    var hdtSaved = HOTDRINK_DEBOUNCE_THRESHOLD;

    if (typeof options === "object") {
      var value = options.value;
      if (options.debounce) HOTDRINK_DEBOUNCE_THRESHOLD = options.debounce;
    } else {
      var value = options;
    }

    subbindText(view, value);

    HOTDRINK_DEBOUNCE_THRESHOLD = hdtSaved;
  };

  namespace.extend("hotdrink.bindings.html", {
    bindText: bindText,
    bindLabel: common.readOnlyBinder(
      function write(view, value) {
        ASSERT(view instanceof jQuery, "expected jQuery object");
        if (typeof value !== "string") value = JSON.stringify(value);
        view.text(value);
      })
  });

}());

