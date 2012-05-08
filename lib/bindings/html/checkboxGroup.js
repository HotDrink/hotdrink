(function () {

  var common = hotdrink.bindings.html.common;

  /* TODO: Should we rather bind each individual checkbox? */
  var getValue = function getValue(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    var values = view.filter(":checked")
                     .map(function () { return $(this).val(); })
                     .get();
    return values;
  };

  var subbind = common.binder(
    common.setValue, common.onChange, getValue, common.toModel, common.validate, common.toView, common.enable, common.disable);

  var bind = function bind(view, binding) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hotdrink.isVariable(binding.value),
      "checkboxGroup can bind to variables only");

    /* Get the rest of the checkboxes in this group. */
    var name = view.attr("name");
    if (name) {
      view = $("input[name=" + name + "]", view.closest("form, body"));
    }

    /* Now do normal binding. */
    subbind(view, binding);
  };

  namespace.open("hotdrink.bindings.html").bindCheckboxGroup = bind;

}());

