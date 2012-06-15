(function () {

  var common = hd.__private.bindings;

  var write = function writeCheckbox(view, value) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(typeof value === "boolean" || (typeof value === "object" &&
      value instanceof Array),
      "expected array or boolean value for checkbox; got " + typeof value);
    if (typeof value === "boolean") {
      view.prop("checked", value);
    } else if (typeof value === "object" && value instanceof Array) {
      view.prop("checked", value.indexOf(view.val()) >= 0);
    }
    //alert("WRITE - view: '" + view.val() + "' value: '" + value + "'");
    
  };

  var onChange = function onChangeCheckbox(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    /* keyup instead of keypress, otherwise we'll read the
     * value before the user's edit. */
    //alert("view: '" + view.val() + "'");
    view.on("click keyup", listener);
  };

  var read = function readCheckbox(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    //alert("READ - view: '" + view.val() + "', "  + view.prop("checked") + "'");
    var name = view.attr("name");
    if (name) {
      view = $("input[name=" + name + "]", view.closest("form, body"));
    } 
    if (view.length == 1) {
      return { value: view.prop("checked") };
    }
    var values = view.filter(":checked")
                      .map(function () { return $(this).val(); })
                      .get();
    return { value: values };;
  };

  hd.binders["checkbox"] = common.binder({
    write:    write,
    onChange: onChange,
    read:     read
  });

}());

