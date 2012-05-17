(function () {

  var common = hotdrink.bindings.html.common;

  var setValue = function (view, value) {
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

  var getValue = function (view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return view.prop("checked");
  };

  var bind
    = common.binder(setValue, onChange, getValue, common.toModel, common.validate, common.toView, common.enable, common.disable);

  namespace.open("hotdrink.bindings.html").bindCheckbox = bind;

}());

