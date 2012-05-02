/**
 * @fileOverview <p>{@link hotdrink.model.Factory}</p>
 * @author John Freeman
 */

//provides("hotdrink.model.Factory");

(function () {

  var Factory = hotdrink.model.Factory;

  /***************************************************************/
  /* Variables. */

  Factory.prototype.variable = function variable(initialValue) {
    var vv = this.addVariable("interface", initialValue);
    return hotdrink.model.makeVariableProxy(vv, this.runtime);
  };

  Factory.prototype.list = function list(initialValue) {
    var vv = this.addVariable("interface", initialValue);
    return hotdrink.model.makeArrayProxy(vv, this.runtime);
  };

  /**
   * @param {Function :: () -> [concept.model.Value]} fn
   *   An array of references to variables that this method writes. If there is
   *   only a single output, then it can be given without wrapping it in an
   *   array.
   */
  Factory.prototype.computed = function computed(fn) {
    var vv = this.addComputedVariable("logic", fn);
    return hotdrink.model.makeVariableProxy(vv, this.runtime);
  };

  /***************************************************************/
  /* Commands. */

  Factory.prototype.command = function command(fn) {
    var vv = this.addComputedVariable("output", fn);
    return hotdrink.model.makeCommandProxy(vv, this.runtime);
  };

  /* This helps us wrap a function call so it can be executed later,
   * if desired. */
  Factory.prototype.fn = function fn(fnToWrap) {
    /* The outer function takes the arguments to be passed to the wrapped
     * function. It will be called inside a method. It will return a wrapped
     * function to be stored as the value of the output variable.
     *
     * The inner function will call the wrapped function with both the stored
     * arguments from the method and any new arguments. It may be called by the
     * user. */
    return function () {
      var context = this;
      var argsToPass = [].slice.call(arguments);
      return function () {
        return fnToWrap.apply(context, argsToPass.concat(arguments));
      };
    };
  };

}());

