/**
 * @fileOverview <p>{@link hotdrink.bindings.html.radioGroup}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.html.radioGroup");

(function () {

  var common = hotdrink.bindings.html.common;

  var write = function write(views, value) {
    $(views).filter(function () { return $(this).val() === value; })
            .prop("checked", true);
  };

  /* TODO: Should we rather bind each individual radio to just set its value? */
  var read = function read(views) {
    return { value : $(views).filter(":checked").val() };
  };

  var subbind = common.binder(
    write, common.onChange, read, common.enable, common.disable);

  var bind = function bind(view, model, variable) {
    /* Get the rest of the radios in this group. */
    view = $(view);
    var name = view.attr("name");
    if (name) {
      view = $("input[name=" + name + "]", view.closest("form, body"));
    }
    var views = view;

    /* Now do normal binding. */
    subbind(views, model, variable);
  };

  namespace.open("hotdrink.bindings.html").bindRadioGroup = bind;

}());

