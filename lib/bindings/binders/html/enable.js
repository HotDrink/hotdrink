(function () {
  
  var writeEnable = function writeEnable(view, truthy) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    if (!!truthy) {
      view.removeAttr("disabled");
    } else {
      view.attr("disabled", "disabled");
    }
  };
  
  hd.binders["enable"] = function bindEnable(view, truthy) {
    hd.bindWrite(truthy, view, { write: writeEnable });
  };
  
  var writeDisable = function writeDisable(view, truthy) {
    return writeEnable(view, !truthy);
  };
  
  hd.binders["disable"] = function bindDisable(view, truthy) {
    hd.bindWrite(truthy, view, { write: writeDisable });
  };

}());

