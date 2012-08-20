(function () {

  var common = hd.__private.bindings;

  var onChange = function onChangeTextbox(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    /* keyup instead of keypress, otherwise we'll read the
     * value before the user's edit. */
    view.on("keyup", listener);
  };

  var subbind = common.binder({ onChange: onChange });

  hd.binders["textbox"] = function bindTextbox(view, options) {
    var hdtSaved = HOTDRINK_DEBOUNCE_THRESHOLD;
    var value;

    if (typeof options === "object") {
      value = options.value;
      if (options.debounce) {
        HOTDRINK_DEBOUNCE_THRESHOLD = options.debounce;
      }
      if (options.toView || options.toModel || options.validate) {
        if (!hd.isScratch(value)) {
          value = hd.scratch(value);
        }
        if (options.validate) {
          value.validate.prependOutgoing(options.validate);
        }
        if (options.toModel) {
          value.validate.prependOutgoing(options.toModel);
        }
        if (options.toView) {
          value.validate.incoming(options.toView);
        }
      }
    }
    else {
      value = options;
    }

    subbind(view, value);

    HOTDRINK_DEBOUNCE_THRESHOLD = hdtSaved;
  };

}());

