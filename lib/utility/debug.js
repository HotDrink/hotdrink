/* New library below. After transitional period, remove all code above. */

var raid = (function () {

  var error = function (message) {
    if (!window.console) {
      return;
    }
    console.error("error: " + message);
  };

  var warning = function (message) {
    if (!window.console) {
      return;
    }
    console.warn("warning: " + message);
  };

  var info = function (message) {
    if (!window.console) {
      return;
    }
    console.info("info: " + message);
  };

  var log = function (message) {
    if (!window.console) {
      return;
    }
    //if (typeof message !== "string") {
      //message = Object.toJSON(message);
    //}
    console.log("log: " + message);
  };

  var debug = function (message) {
    if (!window.console) {
      return;
    }
    console.debug("debug: " + message);
    //console.groupCollapsed("debug: " + message);
    //console.trace();
    //console.groupEnd();
  };

  var assert = function (condition, message) {
    if (typeof message === "undefined") {
      message = "assertion failed";
    }
    /* TODO: type checking? */
    if (!condition) {
      error(message);
    }
  };

  return {
    error : error,
    warning : warning,
    info : info,
    log : log,
    debug : debug,
    assert : assert
  };

}());

