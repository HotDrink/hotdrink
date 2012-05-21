(function () {

  var common = hd.__private.bindings;

  /* TODO: Should we rather bind each individual checkbox? */
  var read = function read(views) {
    ASSERT(views instanceof jQuery, "expected jQuery object");
    var values = views.filter(":checked")
                      .map(function () { return $(this).val(); })
                      .get();
    return { value: values };
  };

  var subbind = common.binder({ read: read });

  var bind = function bind(view, variable) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hd.isVariable(variable),
      "checkboxGroup can bind to variables only");

    /* Get the rest of the checkboxes in this group. */
    var name = view.attr("name");
    if (name) {
      view = $("input[name=" + name + "]", view.closest("form, body"));
    }

    /* Now do normal binding. */
    subbind(view, variable);
  };

  hd.binders["checkboxGroup"] = bind;

}());

