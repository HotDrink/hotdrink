(function () {

  var common = hd.__private.bindings;

  var write = function writeCheckbox(view, value) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(typeof value === "boolean",
      "expected boolean value for checkbox; got " + typeof value);
    view.prop("checked", value);
  };

  var onChange = function onChangeCheckbox(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    /* keyup instead of keypress, otherwise we'll read the
     * value before the user's edit. */
    view.on("click keyup", listener);
  };

  var read = function readCheckbox(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return { value: view.prop("checked") };
  };

  hd.binders["checkbox"] = common.binder({
    write:    write,
    onChange: onChange,
    read:     read
  });

}());
