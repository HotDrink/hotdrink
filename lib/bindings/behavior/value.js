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
    LOG("reading #" + view.attr("id"));
    return { value: view.val() };
  };

  /* This binder cannot accept a non-variable. It makes no sense to assign to
   * a constant. */
  var bindRead = function bindRead(view, variable, options) {
    ASSERT(hd.isVariable(variable), "expected variable proxy");

    options      = options || {};
    var onChange = options.onChange || defaults.onChange;
    var read     = options.read     || defaults.read;

    var readListener = function readListener() {
      var maybe = read(view);
      if (maybe.hasOwnProperty("value")) {
        variable(maybe.value);
      } else if (maybe.hasOwnProperty("error")) {
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
    LOG("writing #" + view.attr("id"));
    return view.val(value);
  };

  var bindWrite = function bindWrite(value, view, options) {
    options   = options || {};
    var write = options.write || defaults.write;

    if (hd.isProxy(value)) {
      ASSERT(hd.isVariable(value), "expected variable proxy");

      /* changeEvent may contain information on incremental changes. write
       * should understand how to interpret (or ignore) it. */
      var writeListener = function writeListener(/*changes...*/) {
        /* TODO: Unbind elements when removing them. */
        write(view, value(), Array.prototype.slice.call(arguments));
      };

      value.subscribe("value", writeListener);
      write(view, value(), [{ set: true }]);

    } else {
      /* The option is a constant value. */
      write(view, value, [{ set: true }]);
    }
  };

  hd.bindRead  = bindRead;
  hd.bindWrite = bindWrite;

}());

