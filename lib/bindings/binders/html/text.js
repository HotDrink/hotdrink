(function () {

  var write = function writeText(view, value) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    if (typeof value !== "string") value = JSON.stringify(value);
    view.text(value);
    view.html(view.text().replace(/ /g,"&nbsp").replace(/\n/g,"<br />"));
  };

  /* @param option { hd.variable | String } */
  hd.binders["text"] = function bindText(view, option) {
    hd.bindWrite(option, view, { write: write });
  };

}());

