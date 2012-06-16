(function () {

  hd.binders["style"] = function bindStyle(view, styles) {

    Object.keys(styles).forEach(function (styleName) {
      var write = function writeStyle(view, value) {
        ASSERT(view instanceof jQuery, "expected jQuery object");
        view.css(styleName, value);
      };

      var value = styles[styleName];
      hd.bindWrite(value, view, { write: write });
    });

  };

}());

