(function () {

  hd.binders["css"] = function bindCss(view, classes) {

    Object.keys(classes).forEach(function (className) {
      var write = function writeCss(view, truthy) {
        ASSERT(view instanceof jQuery, "expected jQuery object");
        view.toggleClass(className, !!truthy);
      };

      var truthy = classes[className];
      hd.bindWrite(truthy, view, { write: write });
    });

  };

}());

