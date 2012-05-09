(function () {

  var enableB = hotdrink.bindings.behavior.enablement;

  var bind = function bind(view, command, context) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(typeof command === "function", "expected command or function");

    /* Assume functions should be executed in context. */
    view.on("click", function (evt) {
      command.call(context);
      return false;
    });

    if (hotdrink.isCommand(command)) {
      enableB.bindEnablement(command, view);
    }
  };

  hd.binders["command"] = bind;
  hd.binders["click"]   = bind;

}());

