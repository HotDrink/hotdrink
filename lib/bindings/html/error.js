/**
 * @fileOverview <p>{@link hotdrink.bindings.html.error}</p>
 * @author Gabriel Foust
 */

//provides("hotdrink.bindings.html.error")

(function () {

  var write = function write(view, value) {
    if (typeof value !== "string") value = JSON.stringify(value);
    $(view).text(value);
  }

  var bind = function bind(view, model, params, controller) {
    var id = params.value;

    ASSERT(!(hotdrink.isVariable(id)),
      "passed variable to error binding instead of id");

    controller.subscribeToError(id, write, view);
  };

  namespace.open("hotdrink.bindings.html").bindError = bind;

}());