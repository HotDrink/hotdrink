/**
 * @fileOverview <p>{@link hotdrink.bindings.html.error}</p>
 * @author Gabriel Foust
 */

//provides("hotdrink.bindings.html.error")

(function () {

  var bind = function bind(view, binding) {
    ASSERT(view instanceof jQuery, "expected jQuery object");

    var value = binding.value;
    ASSERT(hotdrink.isBinding(value), "error binder requires a binding object");

    var originalContents = view.contents();

    var write = function write(view, value) {
      ASSERT(view instanceof jQuery, "expected jQuery object");
      if (value === null)
        view.contents().replaceWith(originalContents);
        //$(view).html("&nbsp;");
      else if (typeof value !== "string")
        view.text(JSON.stringify(value));
      else
        view.text(value);
    }

    value.subscribe('error', updateView, {write: write, view: view});
  };

  var updateView = function updateView(value) {
    this.write(this.view, value);
  };

  namespace.open("hotdrink.bindings.html").bindError = bind;

}());