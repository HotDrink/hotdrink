(function () {

  var common = hd.__private.bindings;

  var write = function writeRadioGroup(views, value) {
    ASSERT(views instanceof jQuery, "expected jQuery object");
    views.filter(function () { return $(this).val() === value; })
         .prop("checked", true);
  };

  /* TODO: Should we rather bind each individual radio? */
  var read = function readRadioGroup(views) {
    ASSERT(views instanceof jQuery, "expected jQuery object");
    return { value: views.filter(":checked").val() };
  };

  var subbind = common.binder({ write: write, read: read });

  hd.binders["radioGroup"] = function bindRadioGroup(view, variable) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hd.isVariable(variable),
      "radioGroup can bind to variables only");
    
    if(view.get(0).tagName.toLowerCase() === "input" &&
        view.attr("type").toLowerCase() === "radio") {

      /* Get the rest of the radios in this group. */
      var name = view.attr("name");
      if (name) {
        view = $("input[name=" + name + "]", view.closest("form, body"));
      }
    } else {
      view = view.find("input");
    }

    /* Now do normal binding. */
    subbind(view, variable);
  };

}());

