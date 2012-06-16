(function () {

  var proxies = hd.__private.proxies = {};

  /* Proxies are functions. Since we cannot subclass Function, any methods
   * that we want every proxy to have must be copied onto each one. Further,
   * any instance data (e.g. the variable proxied) must be hidden under a
   * special member. */

  var hdProtoName = "__hd_proto__";
  var unwrap      = function unwrap() { return this[hdProtoName]; };

  var subscribe = function subscribe() {
    var vv = this.unwrap();
    return vv.subscribe.apply(vv, arguments);
  };

  proxies.finishProxy = function finishProxy(vv, proxy) {
    ASSERT(!vv.proxy, "only one proxy should exist per variable");
    vv.proxy           = proxy;
    proxy[hdProtoName] = vv;
    proxy.unwrap       = unwrap;
    proxy.subscribe    = subscribe;
    return proxy;
  };

  /**
   * @name is
   * @methodOf hd.__private.Variable
   * @param {Unknown} proxy
   * @returns {boolean} True if the argument is a {@link concept.model.Proxy}.
   */
  hd.isProxy = function isProxy(unknown) {
    /* Cannot use Object.hasOwnProperty on functions. */
    return (typeof unknown === "function") && (hdProtoName in unknown);
  };

}());

