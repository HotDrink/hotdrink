(function () {

  var makeWrite = function makeWrite(contents) {
    return function writeText(view, value) {
      ASSERT(view instanceof jQuery, "expected jQuery object");
      if (value === null)
        view.text(contents);
      else {
        if (typeof value !== "string") value = JSON.stringify(value);
        view.text(value);
      }
    };
  };

  /* @param option { hd.variable | String } */
  hd.binders["error"] = function bindText(view, option) {
    var value = option;
    ASSERT(hd.isProxy(value), "expected proxy");
    var error = value.unwrap().error;
    ASSERT(error != undefined, "expected proxy to have an error variable");
    ASSERT(view instanceof jQuery, "expected jQuery object");
    var contents = view.text();
    hd.bindWrite(error, view, { write: makeWrite(contents) });
  };

}());

