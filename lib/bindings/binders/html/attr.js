(function () {

  var common = hd.__private.bindings;

  var bind = function bind(view, attrBindings) {

    Object.keys(attrBindings).forEach(function (attrName) {
      var write = function write(view, value) {
        ASSERT(view instanceof jQuery, "expected jQuery object");
        ASSERT(typeof value === "string",
          "expected string value for attribute " + attrName);
        view.attr(attrName, value);
      };

      var value = attrBindings[attrName];
      hd.bindWrite(value, view, { write: write });
    });

  };

  hd.binders["attr"] = bind;

}());

