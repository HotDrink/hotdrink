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
  var unwrap = function unwrap() { return this[hdProtoName]; };
  var subscribe = function subscribe() {
    var vv = this.unwrap();
    return vv.subscribe.apply(vv, arguments);
  };

  var finishProxy = function finishProxy(vv, runtime, proxy) {
    vv.runtime         = runtime;
    ASSERT(!vv.proxy, "only one proxy should exist per variable");
    vv.proxy           = proxy;
    proxy[hdProtoName] = vv;
    proxy.unwrap       = unwrap;
    proxy.subscribe    = subscribe;
    return proxy;
  };

  var push = function push() {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    vv.changeEvent = { add: [vv.value.length, arguments.length] };
    Array.prototype.push.apply(vv.value, arguments);

    vv.runtime.touch(vv);
  };

  /* TODO: Multi-item remove() requires changeEvent support. */
  var remove = function remove(item) {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    /* Abort when no change. */
    var index = vv.value.indexOf(item);
    if (index < 0) return;
    vv.changeEvent = { remove: [index, 1] };
    vv.value.splice(index, 1);

    vv.runtime.touch(vv);
  };

  var pop = function pop() {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    /* Abort when no change. */
    if (vv.value.length === 0) return;
    vv.changeEvent = { remove: [vv.value.length - 1, 1] };
    vv.value.pop();

    vv.runtime.touch(vv);
  };

  var makeArrayProxy = function makeArrayProxy(vv, runtime) {
    ASSERT(vv.cellType = "interface",
      "cannot make array proxy for " + vv);
    ASSERT(Array.isArray(vv.value),
      "array proxies are for array values only");

    var proxy = function (a0, a1) {
      if (arguments.length === 1) {
        /* Array assignment: proxy(other) */
        runtime.set(vv, a0);
      } else if (arguments.length === 2) {
        /* Element assignment: proxy(index, elt) */
        vv.value[a0] = a1;
        vv.changeEvent = { remove: [a0, 1], add: [a0, 1] };
        runtime.touch(vv);
      } else {
        return runtime.getVariable(vv);
      }
    };

    proxy.push   = push;
    proxy.pop    = pop;
    proxy.remove = remove;

    return finishProxy(vv, runtime, proxy);
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

    isArray : function isArray(proxy) {
      return isProxy(proxy) && Array.isArray(proxy.unwrap().value);
    },

    /**
     * @param {Unknown} proxy
     * @returns {boolean}
     *   True if the argument is a {@link concept.model.Proxy} for a
     *   {@link hotdrink.model.Variable} that is not a
     *   {@link concept.model.Command}.
     */
    isVariable : function isVariable(proxy) {
      return isProxy(proxy) && (proxy.unwrap().cellType !== "output");
    },

    /**
     * @param {Unknown} proxy
     * @returns {boolean}
     *   True if the argument is a {@link concept.model.Proxy} for a
     *   {@link hotdrink.model.Variable} that is a
     *   {@link concept.model.Command}.
     */
    isCommand : function isCommand(proxy) {
      return isProxy(proxy) && (proxy.unwrap().cellType === "output");
    }

  });

  namespace.extend("hotdrink.model", {
    makeVariableProxy : makeVariableProxy,
    makeArrayProxy    : makeArrayProxy,
    makeCommandProxy  : makeCommandProxy
  });

}());

