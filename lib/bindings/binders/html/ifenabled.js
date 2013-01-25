(function () {

  var disable = function disable(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    view.get(0).style.display = "none";
  };

  var enable = function enable(view) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    view.get(0).style.display = "";
  };

  var optionsIfEnabled = {
    enable:  enable,
    disable: disable
  };

  hd.binders["ifenabled"] = function bindIfEnabled(view, variable) {
    hd.bindEnablement(variable, view, optionsIfEnabled);
  };

  var optionsIfDisabled = {
    enable:  disable,
    disable: enable,
  };

  hd.binders["ifdisabled"] = function bindIfDisabled(view, variable) {
    hd.bindEnablement(variable, view, optionsIfDisabled);
  };

}());

