(function () {

  var bind = function bind(view, classBindings) {

    Object.keys(classBindings).forEach(function (className) {
      var write = function write(view, value) {
        ASSERT(view instanceof jQuery, "expected jQuery object");
        ASSERT(typeof value === "boolean",
          "expected boolean value for toggling class " + className);
        view.toggleClass(className, !!value);
      };

      var value = classBindings[className];
      hd.bindWrite(value, view, { write: write });
    });

  };

  hd.binders["css"] = bind;

}());

