/**
 * @fileOverview <p>{@link hotdrink.bindings.html.number}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.html.number");

(function () {

  var common = hotdrink.bindings.html.common;

  var onChange = function onChange(view, listener) {
    /* keyup instead of keypress, otherwise we'll read the
     * value before the user's edit. */
    $(view).bind("keyup", listener);
  };

  var bind = common.binder(
    common.setValue, onChange, common.getValue, common.convertNumber, common.validate, common.convertBackToString, common.enable, common.disable);

  namespace.open("hotdrink.bindings.html").bindNumber = bind;

}());

