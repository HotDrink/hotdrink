(function () {

  var common = hotdrink.bindings.html.common;

  var write = function write(views, value) {
    ASSERT(views instanceof jQuery, "expected jQuery object");
    views.filter(function () { return $(this).val() === value; })
         .prop("checked", true);
  };

  /* TODO: Should we rather bind each individual radio? */
  var read = function read(views) {
    ASSERT(views instanceof jQuery, "expected jQuery object");
    return { value: views.filter(":checked").val() };
  };

  var subbind = common.binder({ write: write, read: read });

  var bind = function bind(view, variable) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hotdrink.isVariable(variable),
      "radioGroup can bind to variables only");

    /* Get the rest of the radios in this group. */
    var name = view.attr("name");
    if (name) {
      view = $("input[name=" + name + "]", view.closest("form, body"));
    }

    /* Now do normal binding. */
    subbind(view, variable);
  };

  hd.binders["radioGroup"] = bind;

}());

