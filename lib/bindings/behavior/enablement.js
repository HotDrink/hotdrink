/**
 * @fileOverview <p>{@link hotdrink.bindings.behavior.enablement}</p>
 * @author John Freeman
 */

//provides("hotdrink.bindings.behavior.enablement);

(function () {

  /**
   * @name bindEnablement
   * @memberOf hotdrink.bindings.behavior.enablement
   * @description
   *   Registers a listener with the model. The listener will call disable or
   *   enable on the view whenever
   *   {@link hotdrink.model.behavior.EnablementGraph} signals that the bound
   *   variable can or cannot be disabled, respectively.
   * @public
   * @static
   * @function
   * @param {hotdrink.model.Controller} model
   * @param {String} variable
   * @param {concept.view.View -> ()} enable
   * @param {concept.view.View -> ()} disable
   * @param {concept.view.View} view
   */
  var bindEnablement = function (model, variable, enable, disable, view) {
    var listener = function (vv) {
      if (vv.canBeDisabled) {
        LOG("disabling #" + $(view).attr("id"));
        disable(view);
      } else {
        LOG("enabling #" + $(view).attr("id"));
        enable(view);
      }
    };

    variable.subscribe("canBeDisabled", listener);
    listener(variable.getMore());
  };

  /**
   * @name hotdrink.controller.behavior.enablement
   * @namespace
   *   Support enablement and disablement of widgets. Model of
   *   {@link concept.view.Behavior}.
   */
  namespace.extend("hotdrink.bindings.behavior.enablement", {
    bindEnablement : bindEnablement
  });

}());

