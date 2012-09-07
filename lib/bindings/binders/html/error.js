(function () {

  var makeWrite = function makeWrite(msgDefault) {
    return function writeText(view, value) {
      ASSERT(view instanceof jQuery, "expected jQuery object");
      /* Use `==` to catch both undefined and null. */
      if (value == null) {
        view.text(msgDefault);
      } else {
        if (typeof value !== "string") {
          value = JSON.stringify(value);
        }
        view.text(value);
      }
    };
  };

  /* @param option { hd.variable | String } */
  hd.binders["error"] = function bindText(view, value) {
    ASSERT(hd.isProxy(value), "expected proxy");
    var error = value.unwrap().error;
    ASSERT(hd.isProxy(error), "expected proxy to have an error variable");
    ASSERT(view instanceof jQuery, "expected jQuery object");
    var msgDefault = view.text();
    hd.bindWrite(error, view, { write: makeWrite(msgDefault) });
  };

}());

