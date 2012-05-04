/**
 * @fileOverview <p>{@link hotdrink.bindings.html.attr}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.html.attr");

(function () {

  var common = hotdrink.bindings.html.common;
  var valueB = hotdrink.bindings.behavior.value;

  var bind = function bind(view, model, binding) {
    var attrBindings = binding.value
    Object.keys(attrBindings).forEach(function (attrName) {
      var write = function write(view, value) {
        var valueStr = value.toString();
        $(view).attr(attrName, value.toString());
        return {value : valueStr};
      };

      var variable = attrBindings[attrName];
      if (typeof variable === "function" ) {
        valueB.bindWrite(model, variable, write, view, binding);
      } else {
        ASSERT(typeof variable === "string",
          "expected string value for attribute" + attrName);
        write(view, variable);
      }
    });
  };

  namespace.open("hotdrink.bindings.html").bindAttr = bind;

}());

