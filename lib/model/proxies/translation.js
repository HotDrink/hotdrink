(function () {

  var proxies = hd.__private.proxies;
  var validators = hd.validators;

  var Validation = function Validation(source, error) {
    this.source = source;
    this.error = error;
    this.validators = [];
    this.fn = sequence.bind(this);
  };

  var sequence = function sequence() {
    var value = this.source();
    var validators = this.validators;
    var i;
    for (i = 0; i < validators.length; ++i) {
      var result = validators[i](value);
      if ('error' in result) {
        this.error(result.error);
        return undefined;
      } else if ('value' in result) {
        value = result.value;
      }
    }
    return [value, null];
  };

  /********************************************************/

  var ValidatorFactory = function ValidatorFactory(outgoing, incoming) {
    this._outgoing = outgoing;
    this._incoming = incoming;
  }

  ValidatorFactory.prototype = hd.validators;

  /********************************************************/

  proxies.makeTranslationProxy = function makeTranslationProxy(vv, target, error) {
    ASSERT(hd.isProxy(target), "expected proxy for target");
    ASSERT(hd.isProxy(error), "expected proxy for error");

    var translation = proxies.makeVariableProxy(vv);

    vv.error = error;
    vv.outgoing = new Validation(translation, error);
    vv.incoming = new Validation(target, error);

    hd.constraint([translation, target, error])
      .method([target, error], vv.outgoing.fn)
      .method([translation, error], vv.incoming.fn);

    translation.validate = new ValidatorFactory(vv.outgoing.validators, vv.incoming.validators);
    return translation;
  };

  hd.isTranslation = function isTranslation(proxy) {
    return (hd.isVariable(proxy) && proxy.unwrap().incoming);
  };

  hd.isTranslator = hd.isTranslation;

}());