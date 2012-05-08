(function () {

  var common = hotdrink.bindings.html.common;

  var write = function write(view, value) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(typeof value === "boolean",
      "expected boolean value for checkbox");
    view.prop("checked", value);
  };

  var onChange = function onChange(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    /* keyup instead of keypress, otherwise we'll read the
     * value before the user's edit. */
    view.bind("click keyup", listener);
  };

  var read = function read(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return { value: view.prop("checked") };
  };

  var bind
    = common.binder(write, onChange, read, common.enable, common.disable);

  namespace.open("hotdrink.bindings.html").bindCheckbox = bind;

}());

