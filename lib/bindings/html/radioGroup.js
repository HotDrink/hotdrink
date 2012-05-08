(function () {

  var common = hotdrink.bindings.html.common;

  var setValue = function setValue(views, value) {
    ASSERT(views instanceof jQuery, "expected jQuery object");
    views.filter(function () { return $(this).val() === value; })
         .prop("checked", true);
  };

  /* TODO: Should we rather bind each individual radio to just set its value? */
  var getValue = function getValue(views) {
    ASSERT(views instanceof jQuery, "expected jQuery object");
    return views.filter(":checked").val();
  };

  var subbind = common.binder(
    setValue, common.onChange, getValue, common.toModel, common.validate, common.toView, common.enable, common.disable);

  var bind = function bind(view, binding) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hotdrink.isVariable(binding.value),
      "radioGroup can bind to variables only");
    /* Get the rest of the radios in this group. */
    var name = view.attr("name");
    if (name) {
      view = $("input[name=" + name + "]", view.closest("form, body"));
    }

    /* Now do normal binding. */
    subbind(view, binding);
  };

  namespace.open("hotdrink.bindings.html").bindRadioGroup = bind;

}());

