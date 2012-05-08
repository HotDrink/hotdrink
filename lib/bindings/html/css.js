(function () {

  var common = hotdrink.bindings.html.common;
  var valueB = hotdrink.bindings.behavior.value;

  var bind = function bind(view, classBindings) {

    Object.keys(classBindings).forEach(function (className) {
      var write = function write(view, value) {
        ASSERT(view instanceof jQuery, "expected jQuery object");
        view.toggleClass(className, !!value);
      };

      var value = classBindings[className];
      if (hotdrink.isVariable(value)) {
        valueB.bindWrite(value, write, view);
      } else {
        ASSERT(typeof value === "boolean",
          "expected boolean value for toggling class " + className);
        write(view, value);
      }
    });

  };

  namespace.open("hotdrink.bindings.html").bindClass = bind;

}());

