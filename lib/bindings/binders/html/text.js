(function () {

  var write = function writeText(view, value) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    if (typeof value !== "string") {
      value = JSON.stringify(value);
    }
    /* Encode HTML entities. */
    value = view.text(value).html();
    view.html(value.replace(/\n/g,"<br />"));
  };

  /* @param option { hd.variable | String } */
  hd.binders["text"] = function bindText(view, option) {
    hd.bindWrite(option, view, { write: write });
  };

}());

