(function () {

  var proxies = hd.__private.proxies;
  var validators = hd.validators;

  proxies.makeScratchProxy = function makeScratchProxy(proxy) {
    var vv = proxy.unwrap();
    proxy.validate = new ValidatorFactory(vv.translateFrom.validators, vv.translateTo.validators);
    return proxy;
  };

  hd.isScratch = function isScratch(proxy) {
    return hd.isVariable(proxy) && (proxy.unwrap().translateTo !== undefined);
  };

  function ValidatorFactory (outgoing, incoming) {
    this._outgoing = outgoing;
    this._incoming = incoming;
  }

  ValidatorFactory.prototype = hd.validators;

}());