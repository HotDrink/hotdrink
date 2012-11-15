(function () {

  var proxies   = hd.__private.proxies;
  var runtime   = hd.__private.runtime;
  var evaluator = hd.__private.evaluator;

  proxies.makeVariableProxy = function makeVariableProxy(vv) {
    ASSERT(vv.cellType === "interface" || vv.cellType === "logic",
      "cannot make variable proxy for " + vv);

    var proxy = function hdVariableProxy(value) {
      if (arguments.length > 0) {
        LOG("edited " + vv + ": " + JSON.stringify(value));
        /* Setting a variable with its current value should still touch it. We
         * will check for identity assignments later. Multiple assignments to the
         * same variable are reduced to one (the latest) so that we do not call
         * set() more than once. */
        vv.set(value);
        runtime.touch(vv);
      } else {
        return evaluator.get(vv);
      }
    };

    return proxies.finishProxy(vv, proxy);
  };

  var setMissing = function setMissing() {
    ERROR("cannot set a computed variable");
  };

  proxies.makeComputedProxy = function makeComputedProxy(vv, set) {
    ASSERT(vv.cellType === "interface" || vv.cellType === "logic",
      "cannot make variable proxy for " + vv);

    if (!set) {
      set = setMissing;
    }
    ASSERT(vv.writtenBy,
      "expected a method to write computed variable");
    var context = vv.writtenBy.context;

    var proxy = function hdComputedProxy(value) {
      if (arguments.length > 0) {
        set.call(context, value);
      } else {
        return evaluator.get(vv);
      }
    };

    return proxies.finishProxy(vv, proxy);
  };

  /**
   * @param {Unknown} proxy
   * @returns {boolean}
   *   True if the argument is a {@link concept.model.Proxy} for a
   *   {@link hd.__private.Variable} that is not a
   *   {@link concept.model.Command}.
   */
  hd.isVariable = function isVariable(proxy) {
    return hd.isProxy(proxy) && (proxy.unwrap().cellType !== "output");
  };

  proxies.makeCommandProxy = function makeCommandProxy(vv) {
    ASSERT(vv.cellType === "output", "cannot make command proxy for " + vv);

    /* Same dangers in calling this as in accessing computed variables:
    * better to wait until the model is updated. */
    var proxy = function hdCommandProxy() {
      ASSERT(!evaluator.isUpdating(),
        "do not call commands from within methods");
      /* Don't just return the stored command, call it for the user. */
      return vv.value.apply(this, arguments);
    };

    return proxies.finishProxy(vv, proxy);
  };

  /**
   * @param {Unknown} proxy
   * @returns {boolean}
   *   True if the argument is a {@link concept.model.Proxy} for a
   *   {@link hd.__private.Variable} that is a
   *   {@link concept.model.Command}.
   */
  hd.isCommand = function isCommand(proxy) {
    return hd.isProxy(proxy) && (proxy.unwrap().cellType === "output");
  };

}());

