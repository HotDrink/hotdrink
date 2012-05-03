(function () {

  var common = hotdrink.bindings.html.common;
  var enableB = hotdrink.bindings.behavior.enablement;

  var bind = function bind(view, command) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    view.bind("click", command);
    if (hotdrink.isCommand(command)) {
      enableB.bindEnablement(
        command, common.enable, common.disable, view);
    }
  };

  namespace.open("hotdrink.bindings.html").bindCommand = bind;

}());

