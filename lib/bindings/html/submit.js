(function () {

  var bind = function bind(view, fn, context) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(typeof fn === "function", "expected event listener");

    /* Assume functions should be executed in context. */
    /* TODO: Factor this and command binder to use common event binder. */
    view.on("submit", function (evt) {
      fn.call(context);
      return false;
    });
  };

  hd.binders["submit"] = bind;

}());

