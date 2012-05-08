(function () {

  var common = hotdrink.bindings.html.common;

  var onChange = function onChange(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    /* keyup instead of keypress, otherwise we'll read the
     * value before the user's edit. */
    view.bind("keyup", listener);
  };

  var read = function read(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return common.convertNumber(view.val());
  };

  var bind = common.binder(
    common.write, onChange, read, common.enable, common.disable);

  namespace.open("hotdrink.bindings.html").bindNumber = bind;

}());

