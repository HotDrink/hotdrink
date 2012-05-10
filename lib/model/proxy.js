(function () {

  var Variable  = hd.__private.Variable;
  var runtime   = hd.__private.runtime;
  var evaluator = hd.__private.evaluator;

  var makeVariableProxy = function makeVariableProxy(vv) {
    ASSERT(vv.cellType === "interface" || vv.cellType === "logic",
      "cannot make variable proxy for " + vv);

    var proxy = function (value) {
      if (arguments.length > 0) {
        //assert(!isUpdating(),
          //"do not set variables from within methods");
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

    return finishProxy(vv, proxy);
  };

  var setMissing = function setMissing() {
    ERROR("cannot set a computed variable");
  };

  var makeComputedProxy = function makeComputedProxy(vv, set) {
    ASSERT(vv.cellType === "interface" || vv.cellType === "logic",
      "cannot make variable proxy for " + vv);

    if (!set) set = setMissing;

    var proxy = function () {
      if (arguments.length > 0) {
        /* TODO: Implement context stack so we can find it outside the
         * proxy. */
        var context = vv.writtenBy.context;
        set.call(context, arguments[0]);
      } else {
        return evaluator.get(vv);
      }
    };

    return finishProxy(vv, proxy);
  };

  var makeCommandProxy = function makeCommandProxy(vv) {
    ASSERT(vv.cellType === "output", "cannot make command proxy for " + vv);

    /* Same dangers in calling this as in accessing computed variables:
    * better to wait until the model is updated. */
    var proxy = function () {
      //assert(!isUpdating(),
        //"do not call commands from within methods");
      /* Don't just return the stored command, call it for the user. */
      return vv.value.apply(this, arguments);
    };

    return finishProxy(vv, proxy);
  };

  /* We cannot subclass Function, so we just extend every proxy object with a
   * prototype. */
  var hdProtoName = "__hd_proto__";
  var unwrap = function unwrap() { return this[hdProtoName]; };
  var subscribe = function subscribe() {
    var vv = this.unwrap();
    return vv.subscribe.apply(vv, arguments);
  };

  var finishProxy = function finishProxy(vv, proxy) {
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

    runtime.touch(vv);
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

    runtime.touch(vv);
  };

  var pop = function pop() {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    /* Abort when no change. */
    if (vv.value.length === 0) return;
    vv.changeEvent = { remove: [vv.value.length - 1, 1] };
    vv.value.pop();

    runtime.touch(vv);
  };

  //var filter = function filter() {
  //};

  var makeArrayProxy = function makeArrayProxy(vv) {
    ASSERT(vv.cellType = "interface",
      "cannot make array proxy for " + vv);
    ASSERT(Array.isArray(vv.value),
      "array proxies are for array values only");

    var proxy = function (a0, a1) {
      if (arguments.length === 1) {
        /* Array assignment: proxy(other) */
        vv.set(a0);
      } else if (arguments.length === 2) {
        /* Element assignment: proxy(index, elt) */
        vv.value[a0] = a1;
        vv.changeEvent = { remove: [a0, 1], add: [a0, 1] };
        runtime.touch(vv);
      } else {
        return evaluator.get(vv);
      }
    };

    proxy.push   = push;
    proxy.pop    = pop;
    proxy.remove = remove;

    return finishProxy(vv, proxy);
  };

  /**
   * @name is
   * @methodOf hd.__private.Variable
   * @param {Unknown} proxy
   * @returns {boolean} True if the argument is a {@link concept.model.Proxy}.
   */
  var isProxy = function isProxy(unknown) {
    /* Cannot use Object.hasOwnProperty on functions. */
    return (typeof unknown === "function") && (hdProtoName in unknown);
  };

  hd.isProxy = isProxy;

  hd.isArray = function isArray(proxy) {
    return isProxy(proxy) && Array.isArray(proxy.unwrap().value);
  };

  /**
   * @param {Unknown} proxy
   * @returns {boolean}
   *   True if the argument is a {@link concept.model.Proxy} for a
   *   {@link hd.__private.Variable} that is not a
   *   {@link concept.model.Command}.
   */
  hd.isVariable = function isVariable(proxy) {
    return isProxy(proxy) && (proxy.unwrap().cellType !== "output");
  };

  /**
   * @param {Unknown} proxy
   * @returns {boolean}
   *   True if the argument is a {@link concept.model.Proxy} for a
   *   {@link hd.__private.Variable} that is a
   *   {@link concept.model.Command}.
   */
  hd.isCommand = function isCommand(proxy) {
    return isProxy(proxy) && (proxy.unwrap().cellType === "output");
  };

  hd.__private.proxies = {
    makeVariableProxy: makeVariableProxy,
    makeComputedProxy: makeComputedProxy,
    makeArrayProxy:    makeArrayProxy,
    makeCommandProxy:  makeCommandProxy
  };

}());

