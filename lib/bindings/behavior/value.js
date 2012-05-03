HOTDRINK_DEBOUNCE_THRESHOLD = 20;

(function () {

  var bindRead = function bindRead(view, onChange, read, variable) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hotdrink.isVariable(variable), "expected variable proxy");

    var readListener = function readListener() {
      LOG("reading #" + view.attr("id"));
      var maybe = read(view);
      if ("value" in maybe) {
        variable(maybe.value);
      } else if ("error" in maybe) {
        WARNING("validation error: " + maybe.error);
      } else {
        ERROR("expected error monad from read");
      }
    };

    onChange(view, debounce(readListener, HOTDRINK_DEBOUNCE_THRESHOLD));
  };

  var bindWrite = function bindWrite(variable, write, view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hotdrink.isVariable(variable), "expected variable proxy");

    /* changeEvent may contain information on incremental changes. write
     * should understand how to interpret (or ignore) it. */
    var writeListener = function writeListener(changeEvent) {
      LOG("writing #" + view.attr("id"));
      write(view, variable(), changeEvent);
    };

    variable.subscribe("value", writeListener);
    writeListener({ set: true });
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

