(function () {

  var common = hotdrink.bindings.html.common;
  var enableB = hotdrink.bindings.behavior.enablement;

  var bind = function bind(view, command, context) {
    ASSERT(view instanceof jQuery, "expected jQuery object");

    /* Assume functions should be executed in context. */
    view.bind("click", command.bind(context));

    if (hotdrink.isCommand(command)) {
      enableB.bindEnablement(
        command, common.enable, common.disable, view);
    }
  };

  namespace.open("hotdrink.bindings.html").bindCommand = bind;

}());

