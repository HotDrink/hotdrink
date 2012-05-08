HOTDRINK_DEBOUNCE_THRESHOLD = 20;

(function () {

  var bindRead = function bindRead(view, onChange, read, variable, binding) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hotdrink.isVariable(variable), "expected variable proxy");

    var readListener = function readListener() {
      LOG("reading #" + view.attr("id"));
      var either = read(view);
      if ("value" in either) {
        binding.error(null);
        variable(either.value);
      } else if ("error" in either) {
        WARNING("validation error: " + either.error);
        binding.error(either.error);
      } else {
        ERROR("expected either-value-error monad from read");
      }
    };

    onChange(view, debounce(readListener, HOTDRINK_DEBOUNCE_THRESHOLD));
  };

  var bindWrite = function (variable, write, view, binding) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hotdrink.isVariable(variable), "expected variable proxy");

    /* changeEvent may contain information on incremental changes. write
     * should understand how to interpret (or ignore) it. */
    var writeListener = function writeListener(changeEvent) {
      LOG("writing #" + view.attr("id"));

      /* TODO: Move into exists() component. */
      if (!view.closest("body").length) {
        throw new Error("view missing");
      }

      var either = write(view, variable(), changeEvent);
      if ("value" in either) {
        binding.error(null);
      } else if ("error" in either) {
        binding.error(either.error);
      } else {
        ERROR("expected either-value-error monad from write");
      }
    };

    variable.subscribe("value", writeListener);
    write(view, variable(), { set: true });
  };

  /**
   * @name hotdrink.controller.behavior.value
   * @namespace
   *   Bind widgets to values in the model. Model of
   *   {@link concept.view.Behavior}.
   */
  namespace.extend("hotdrink.bindings.behavior.value", {
    bindRead: bindRead,
    bindWrite: bindWrite
  });

}());

