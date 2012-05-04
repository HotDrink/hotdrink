/**
 * @fileOverview <p>{@link hotdrink.bindings.html.checkbox}</p>
 * @author John Freeman
 */

//provides("hotdrink.controller.view.html.checkbox");

(function () {

  var common = hotdrink.bindings.html.common;

  var setValue = function (view, value) {
    ASSERT(typeof value === "boolean",
      "expected boolean value for checkbox");
    $(view).prop("checked", value);
  };

  var onChange = function onChange(view, listener) {
    /* keyup instead of keypress, otherwise we'll read the
     * value before the user's edit. */
    $(view).bind("click keyup", listener);
  };

  var getValue = function (view) {
    return $(view).prop("checked");
  };

  var bind
    = common.binder(setValue, onChange, getValue, common.convert, common.validate, common.convertBack, common.enable, common.disable);

  namespace.open("hotdrink.bindings.html").bindCheckbox = bind;

}());

