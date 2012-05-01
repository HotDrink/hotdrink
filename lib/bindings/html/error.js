/**
 * @fileOverview <p>{@link hotdrink.bindings.html.error}</p>
 * @author Gabriel Foust
 */

//provides("hotdrink.bindings.html.error")

(function () {

  var copy = function copy(view) {
    return $(view).contents();
  }

  var paste = function paste(view, $contents) {
    $(view).contents().replaceWith($contents)
  }

  var bind = function bind(view, model, binding) {
    var value = binding.value;

    ASSERT(hotdrink.isBinding(value), "error binder requires a binding object");

    var originalContents = copy(view);

    var write = function write(view, value) {
      if (value === null)
        paste(view, originalContents);
        //$(view).html("&nbsp;");
      else if (typeof value !== "string")
        $(view).text(JSON.stringify(value));
      else
        $(view).text(value);
    }

    value.subscribe('error', updateView, {write: write, view: view});
  };

  var updateView = function updateView(value) {
    this.write(this.view, value);
  };

  namespace.open("hotdrink.bindings.html").bindError = bind;

}());