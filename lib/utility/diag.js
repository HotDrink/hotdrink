var diag = (function () {

  var noop = function () {};

  /* Need console to provide anything useful. */
  if (!window.console) {
    return {
      error:   noop,
      warning: noop,
      info:    noop,
      log:     noop,
      assert:  noop
    };
  }

  var error = function error(message) {
    console.error("error: " + message);
  };

  var warning = function warning(message) {
    console.warn("warning: " + message);
  };

  var info = function info(message) {
    console.info("info: " + message);
  };

  var log = function log(message) {
    if (typeof message === "string") {
      console.log("log: " + message);
    } else {
      console.dir(message);
    }
  };

  var assert = function assert(condition, message) {
    if (typeof message === "undefined") {
      message = "assertion failed";
    }
    /* TODO: type checking? */
    if (!condition) {
      error(message);
    }
  };

  return {
    error:   error,
    warning: warning,
    info:    info,
    log:     log,
    assert:  assert
  };

}());

