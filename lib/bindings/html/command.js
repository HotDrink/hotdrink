/**
 * @fileOverview <p>{@link hotdrink.bindings.html.command}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.html.command");

(function () {

  var common = hotdrink.bindings.html.common;
  var enableB = hotdrink.bindings.behavior.enablement;

  var bind = function bind(view, model, command) {
    ASSERT(typeof command === "function" && command.hotdrink
           && command.getMore().cellType == "output",
      "command widgets are bound only to commands in the model");
    $(view).bind("click", command);
    enableB.bindEnablement(model, command, common.enable, common.disable, view);
  };

  namespace.open("hotdrink.bindings.html").bindCommand = bind;

}());

