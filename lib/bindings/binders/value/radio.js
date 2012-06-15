(function () {

  var common = hd.__private.bindings;

  var write = function writeRadioGroup(view, value) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    view.prop("checked", view.val() === value);
  };

  /* TODO: Should we rather bind each individual radio? */
  var read = function readRadioGroup(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return { value: view.val() };
  };

  var subbind = common.binder({ write: write, read: read });

  hd.binders["radio"] = function bindRadioGroup(view, variable) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hd.isVariable(variable),
      "radio can bind to variables only");

    /* Now do normal binding. */
    subbind(view, variable);
  };

}());


