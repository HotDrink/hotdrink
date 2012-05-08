(function () {

  var bind = function bind(view, fn, context) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(typeof fn === "function", "expected event listener");

    /* Assume functions should be executed in context. */
    view.on("click", function (evt) {
      fn.call(context);
      return false;
    });
  };

  namespace.open("hotdrink.bindings.html").bindClick = bind;

}());

