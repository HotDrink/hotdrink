(function () {

  var writeVisible = function writeVisible(view, truthy) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    view.get(0).style.display = (!!truthy) ? ("") : ("none");
  };

  hd.binders["visible"] = function bindVisible(view, truthy) {
    hd.bindWrite(truthy, view, { write: writeVisible });
  };

  var writeInvisible = function writeInvisible(view, truthy) {
    return writeVisible(view, !truthy);
  };

  hd.binders["invisible"] = function bindInvisible(view, truthy) {
    hd.bindWrite(truthy, view, { write: writeInvisible });
  };

}());

