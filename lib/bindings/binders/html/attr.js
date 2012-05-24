(function () {

  hd.binders["attr"] = function bindAttr(view, attrs) {

    Object.keys(attrs).forEach(function (attrName) {
      var write = function writeAttr(view, value) {
        BEGIN_DEBUG;
        ASSERT(view instanceof jQuery, "expected jQuery object");
        if (typeof value !== "string") {
          WARNING("be careful setting attribute " + attrName +
            " to a non-string value");
        }
        END_DEBUG;
        view.attr(attrName, value);
      };

      var value = attrs[attrName];
      hd.bindWrite(value, view, { write: write });
    });

  };

}());

