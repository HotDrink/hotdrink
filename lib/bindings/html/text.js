/**
 * @fileOverview <p>{@link hotdrink.bindings.html.text}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.html.text");

(function () {

  var common = hotdrink.bindings.html.common;

  var onChange = function onChange(view, listener) {
    /* keyup instead of keypress, otherwise we'll read the
     * value before the user's edit. */
    $(view).bind("keyup", listener);
  };

  var subbindText = common.binder(
    common.write, onChange, common.read, common.enable, common.disable);

  var bindText = function bindText(view, model, options) {
    var hdtSaved = HOTDRINK_DEBOUNCE_THRESHOLD;

    if (typeof options === "object") {
      var variable = options.value;
      if (options.debounce) HOTDRINK_DEBOUNCE_THRESHOLD = options.debounce;
    } else {
      var variable = options;
    }

    subbindText(view, model, variable);

    HOTDRINK_DEBOUNCE_THRESHOLD = hdtSaved;
  };

  namespace.extend("hotdrink.bindings.html", {
    bindText : bindText,
    bindLabel : common.readOnlyBinder(
      /*write=*/function (view, value) {
        if (typeof value !== "string") value = JSON.stringify(value);
        $(view).text(value);
      })
  });

}());

