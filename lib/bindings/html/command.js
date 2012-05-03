(function () {

  var common = hotdrink.bindings.html.common;
  var enableB = hotdrink.bindings.behavior.enablement;

  var bind = function bind(view, command) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(hotdrink.isCommand(command), "command can bind to commands only");
    view.bind("click", command);
    enableB.bindEnablement(
      command, common.enable, common.disable, view);
  };

  namespace.open("hotdrink.bindings.html").bindCommand = bind;

}());

