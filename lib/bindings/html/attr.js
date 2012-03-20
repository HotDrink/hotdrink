/**
 * @fileOverview <p>{@link hotdrink.bindings.html.attr}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.html.attr");

(function () {

  var common = hotdrink.bindings.html.common;
  var valueB = hotdrink.bindings.behavior.value;

  var bind = function bind(view, model, attrBindings) {
    Object.keys(attrBindings).forEach(function (attrName) {
      var write = function write(view, value) {
        $(view).attr(attrName, value);
      };

      var variable = attrBindings[attrName];
      if (typeof variable === "function" ) {
        valueB.bindWrite(model, variable, write, view);
      } else {
        ASSERT(typeof variable === "string",
          "expected string value for attribute" + attrName);
        write(view, variable);
      }
    });
  };

  namespace.open("hotdrink.bindings.html").bindAttr = bind;

}());

