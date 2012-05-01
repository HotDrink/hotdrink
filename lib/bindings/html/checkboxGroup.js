/**
 * @fileOverview <p>{@link hotdrink.bindings.html.checkboxGroup}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.html.checkboxGroup");

(function () {

  var common = hotdrink.bindings.html.common;

  /* TODO: Should we rather bind each individual checkbox to just splice its
   * value in or out? */
  var getValue = function getValue(views) {
    var values = $(views).filter(":checked")
                         .map(function () { return $(this).val(); })
                         .get();
    return values;
  };

  var subbind = common.binder(
    common.write, common.onChange, getValue, common.convert, common.validate, common.enable, common.disable);

  var bind = function bind(view, model, binding) {
    /* Get the rest of the checkboxes in this group. */
    view = $(view);
    var name = view.attr("name");
    if (name) {
      view = $("input[name=" + name + "]", view.closest("form, body"));
    }
    var views = view;

    /* Now do normal binding. */
    subbind(views, model, binding);
  };

  namespace.open("hotdrink.bindings.html").bindCheckboxGroup = bind;

}());

