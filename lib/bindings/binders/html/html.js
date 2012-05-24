(function () {

  var write = function writeHtml(view, htmlStr) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(typeof htmlStr === "string",
      "expected string of HTML for html binder");
    view.html(htmlStr);
  };

  /* @param htmlStr { hd.variable | String } */
  hd.binders["html"] = function bindHtml(view, htmlStr) {
    hd.bindWrite(htmlStr, view, { write: write });
  };

}());

