(function () {

  var proxies = hd.__private.proxies;
  var factory = hd.__private.factory;

  /***************************************************************/
  /* Variables. */

  factory.variable = function variable(initialValue) {
    var vv = this.addVariable("interface", initialValue);
    return proxies.makeVariableProxy(vv);
  };

  factory.list = function list(initialValue) {
    var vv = this.addVariable("interface", initialValue);
    return proxies.makeArrayProxy(vv);
  };

  /**
   * @param {Function :: () -> [concept.model.Value]} fn
   *   An array of references to variables that this method writes. If there is
   *   only a single output, then it can be given without wrapping it in an
   *   array.
   */
  factory.computed = function computed(fn, set) {
    var vv = this.addComputedVariable("logic", fn);
    return proxies.makeComputedProxy(vv, set);
  };

  /***************************************************************/
  /* Commands. */

  factory.command = function command(fn) {
    var vv = this.addComputedVariable("output", fn);
    return proxies.makeCommandProxy(vv);
  };

  /* This helps us wrap a function call so it can be executed later,
   * if desired. */
  factory.fn = function fn(fnToWrap) {
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

  hd.variable = factory.variable.bind(factory);
  hd.list     = factory.list.bind(factory);
  hd.computed = factory.computed.bind(factory);
  hd.command  = factory.command.bind(factory);
  hd.fn       = factory.fn.bind(factory);

  proxies.addArrayProxyMethods(hd.list);

}());

