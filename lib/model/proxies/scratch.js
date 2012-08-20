(function () {

  var proxies = hd.__private.proxies;
  var validators = hd.validators;

  var Translation = function Translation(source) {
    this.source = source;
    this.validators = [];
    this.fn = translate.bind(this);
  };

  var translate = function translate() {
    var value = this.source();
    var error = null;
    var validators = this.validators;
    var i;
    for (i = 0; error === null && i < validators.length; ++i) {
      var result = validators[i](value);
      if ('error' in result) {
        value = undefined;
        error = result.error;
      } else if ('value' in result) {
        value = result.value;
      }
    }
    return [value, error];
  };

  /********************************************************/

  var ValidatorFactory = function ValidatorFactory(outgoing, incoming) {
    this._outgoing = outgoing;
    this._incoming = incoming;
  }

  ValidatorFactory.prototype = hd.validators;

  /********************************************************/

  proxies.makeScratchProxy = function makeScratchProxy(vv, target, error) {
    ASSERT(hd.isProxy(target), "expected proxy for target");
    ASSERT(hd.isProxy(error), "expected proxy for error");

    var scratch = proxies.makeVariableProxy(vv);

    vv.error    = error;
    vv.outgoing = new Translation(scratch);
    vv.incoming = new Translation(target);

    hd.constraint([scratch, target, error])
      .method([target, error], vvScratch.outgoing.fn)
      .method([scratch, error], vvScratch.incoming.fn);

    scratch.validate = new ValidatorFactory(vv.outgoing.validators, vv.incoming.validators);
    return scratch;
  };

  hd.isScratch = function isScratch(proxy) {
    return (hd.isVariable(proxy) && proxy.unwrap().incoming);
  };

}());