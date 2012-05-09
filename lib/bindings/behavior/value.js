HOTDRINK_DEBOUNCE_THRESHOLD = 20;

(function () {

  var defaults = {};

  defaults.onChange = function onChangeDefault(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    view.on("change click keyup", listener);
  };

  /* NOTE: Intended for a single view. */
  defaults.read = function read(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return { value: view.val() };
  };

  var bindRead = function bindRead(view, variable, options) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hotdrink.isVariable(variable), "expected variable proxy");

    options      = options || {};
    var onChange = options.onChange || defaults.onChange;
    var read     = options.read     || defaults.read;

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

  /* NOTE: Intended for a single view. */
  defaults.write = function write(view, value) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    return view.val(value);
  };

  var bindWrite = function bindWrite(value, view, options) {
    ASSERT(view instanceof jQuery, "expected jQuery object");

    options   = options || {};
    var write = options.write || defaults.write;

    if (hotdrink.isProxy(value)) {
      ASSERT(hotdrink.isVariable(value), "expected variable proxy");

      /* changeEvent may contain information on incremental changes. write
       * should understand how to interpret (or ignore) it. */
      var writeListener = function writeListener(changeEvent) {
        LOG("writing #" + view.attr("id"));

        /* TODO: Move into exists() component. */
        if (!view.closest("body").length) {
          throw new Error("view missing");
        }

        write(view, value(), changeEvent);
      };

      value.subscribe("value", writeListener);
      write(view, value(), { set: true });

    } else {
      /* The option is a constant value. */
      write(view, value);
    }

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

