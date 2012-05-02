(function () {

  var Variable = hotdrink.model.Variable;

  /**
   * @methodOf hotdrink.model.Variable#
   * @param {hotdrink.model.Runtime} runtime
   * @returns {concept.model.Proxy}
   */
  var makeVariableProxy = function makeVariableProxy(vv, runtime) {
    ASSERT(vv.cellType === "interface" || vv.cellType === "logic",
      "cannot make variable proxy for " + vv);

    var proxy = function () {
      if (arguments.length > 0) {
        runtime.set(vv, arguments[0]);
      } else {
        return runtime.getVariable(vv);
      }
    };

    return finishProxy(vv, runtime, proxy);
  };

  var makeCommandProxy = function makeCommandProxy(vv, runtime) {
    ASSERT(vv.cellType === "output", "cannot make command proxy for " + vv);

    /* Same dangers in calling this as in accessing computed variables:
    * better to wait until the model is updated. */
    var proxy = function () {
      return runtime.getCommand(vv, this, arguments);
    };

    return finishProxy(vv, runtime, proxy);
  };

  /* We cannot subclass Function, so we just extend every proxy object with a
   * prototype. */
  var hdProtoName = "__hd_proto__";
  var getMore = function getMore() { return this[hdProtoName]; };
  var subscribe = function subscribe() {
    var vv = this.getMore();
    return vv.subscribe.apply(vv, arguments);
  };

  var finishProxy = function finishProxy(vv, runtime, proxy) {
    vv.runtime         = runtime;
    ASSERT(!vv.proxy, "only one proxy should exist per variable");
    vv.proxy           = proxy;
    proxy[hdProtoName] = vv;
    proxy.getMore      = getMore;
    proxy.subscribe    = subscribe;
    return proxy;
  };

  /**
   * @name is
   * @methodOf hotdrink.model.Variable
   * @param {Unknown} proxy
   * @returns {boolean} True if the argument is a {@link concept.model.Proxy}.
   */
  var isProxy = function isProxy(unknown) {
    /* Cannot use Object.hasOwnProperty on functions. */
    return (typeof unknown === "function") && (hdProtoName in unknown);
  };

  /**
   * @lends hotdrink
   */
  namespace.extend("hotdrink", {

    isProxy : isProxy,

    /**
     * @param {Unknown} getter
     * @returns {boolean}
     *   True if the argument is a {@link concept.model.Proxy} for a
     *   {@link hotdrink.model.Variable} that is not a
     *   {@link concept.model.Command}.
     */
    isVariable : function isVariable(getter) {
      return isProxy(getter) && (getter.getMore().cellType !== "output");
    },

    /**
     * @param {Unknown} getter
     * @returns {boolean}
     *   True if the argument is a {@link concept.model.Proxy} for a
     *   {@link hotdrink.model.Variable} that is a
     *   {@link concept.model.Command}.
     */
    isCommand : function isCommand(getter) {
      return isProxy(getter) && (getter.getMore().cellType === "output");
    }

  });

  namespace.extend("hotdrink.model", {
    makeVariableProxy : makeVariableProxy,
    makeCommandProxy  : makeCommandProxy
  });

}());

