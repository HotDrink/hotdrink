(function () {

  var write = function writeCss(view, className) {
    ASSERT(view instanceof jQuery, "expected jQuery object");

    /* Remove the old class if there is one. */
    var old = view.data("hd-klass");
    if (old) {
      view.removeClass(old);
    }

    /* Add the new class and remember it. */
    view.addClass(className);
    view.data("hd-klass", className);
  };

  hd.binders["klass"] = function bindKlass(view, classes) {
    /* Allow short-hand for a single class. */
    if (!Array.isArray(classes)) {
      classes = [classes];
    }

    classes.forEach(function (className) {
      hd.bindWrite(className, view, { write: write });
    });
  };

}());

