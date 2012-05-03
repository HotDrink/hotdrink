(function () {

  var common = hotdrink.bindings.html.common;
  var valueB = hotdrink.bindings.behavior.value;

  var bind = function bind(view, attrBindings) {

    Object.keys(attrBindings).forEach(function (attrName) {
      var write = function write(view, value) {
        $(view).attr(attrName, value);
      };

      var value = attrBindings[attrName];
      if (hotdrink.isVariable(value)) {
        valueB.bindWrite(value, write, view);
      } else {
        ASSERT(typeof value === "string",
          "expected string value for attribute " + attrName);
        write(view, value);
      }
    });

  };

  namespace.open("hotdrink.bindings.html").bindAttr = bind;

}());

