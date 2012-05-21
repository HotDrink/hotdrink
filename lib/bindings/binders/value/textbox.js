(function () {

  var common = hd.__private.bindings;

  var onChange = function onChangeTextbox(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    /* keyup instead of keypress, otherwise we'll read the
     * value before the user's edit. */
    view.bind("keyup", listener);
  };

  var subbind = common.binder({ onChange: onChange });

  hd.binders["textbox"] = function bindTextbox(view, options) {
    var hdtSaved = HOTDRINK_DEBOUNCE_THRESHOLD;

    if (typeof options === "object") {
      var value = options.value;
      if (options.debounce) HOTDRINK_DEBOUNCE_THRESHOLD = options.debounce;
    } else {
      var value = options;
    }

    subbind(view, value);

    HOTDRINK_DEBOUNCE_THRESHOLD = hdtSaved;
  };

}());

