(function () {

  var Variable = hotdrink.model.Variable;

  /**
   * @methodOf hotdrink.model.Variable#
   * @param {hotdrink.model.Runtime} runtime
   * @returns {concept.model.Proxy}
   */
  Variable.prototype.toProxy = function toProxy(runtime) {
    var vv = this;

    if (this.cellType === "interface" || this.cellType === "logic") {
      var proxy = function () {
        if (arguments.length > 0) {
          runtime.set(vv, arguments[0]);
        } else {
          return runtime.getVariable(vv);
        }
      };

    } else if (this.cellType === "output") {
      /* Same dangers in calling this as in accessing computed variables:
       * better to wait until the model is updated. */
      var proxy = function () {
        return runtime.getCommand(vv, this, arguments);
      };

    } else {
      ERROR("no proxy available for " + this.cellType + " variables");
    }

    return finishProxy(vv, proxy);
  };

  var finishProxy = function finishProxy(vv, proxy) {
    proxy.hotdrink = vv;
    proxy.getMore = function getMore() { return vv; };
    proxy.subscribe
      = function () { return vv.subscribe.apply(vv, arguments); };

    return proxy;
  };

  /**
   * @name is
   * @methodOf hotdrink.model.Variable
   * @param {Unknown} proxy
   * @returns {boolean} True if the argument is a {@link concept.model.Proxy}.
   */
  Variable.is = function is(proxy) {
    return (typeof proxy === "function") && (proxy.hotdrink);
  };

  /**
   * @lends hotdrink
   */
  namespace.extend("hotdrink", {

    /**
     * @param {Unknown} getter
     * @returns {boolean}
     *   True if the argument is a {@link concept.model.Proxy} for a
     *   {@link hotdrink.model.Variable} that is not a
     *   {@link concept.model.Command}.
     */
    isVariable : function isVariable(getter) {
      return Variable.is(getter) && (getter.hotdrink.cellType !== "output");
    },

    /**
     * @param {Unknown} getter
     * @returns {boolean}
     *   True if the argument is a {@link concept.model.Proxy} for a
     *   {@link hotdrink.model.Variable} that is a
     *   {@link concept.model.Command}.
     */
    isCommand : function isCommand(getter) {
      return Variable.is(getter) && (getter.hotdrink.cellType === "output");
    }

  });

}());

