(function () {

  var proxies    = hd.__private.proxies;
  var validators = hd.validators;

  var Validation = function Validation(source, error) {
    this.source     = source;
    this.error      = error;
    this.validators = [];
  };

  var sequence = function sequence() {
    var value  = this.source();
    var failed = this.validators.some(function (validate) {
      var either = validate(value);
      if ('error' in either) {
        this.error(either.error);
        return true;
      } else if ('value' in either) {
        value = either.value;
      }
    }, this);
    if (!failed) return [value, null];
  };

  /********************************************************/

  var ValidatorFactory = function ValidatorFactory(outgoing, incoming) {
    this._outgoing = outgoing;
    this._incoming = incoming;
  }

  ValidatorFactory.prototype = hd.validators;

  /********************************************************/

  proxies.makeTranslationProxy
    = function makeTranslationProxy(vv, target, error)
  {
    ASSERT(hd.isProxy(target), "expected proxy for target");
    ASSERT(hd.isProxy(error), "expected proxy for error");

    var translation = proxies.makeVariableProxy(vv);

    vv.error = error;
    vv.outgoing = new Validation(translation, error);
    vv.incoming = new Validation(target, error);

    hd.constraint([translation, target, error])
      .method([target, error], sequence, vv.outgoing)
      .method([translation, error], sequence, vv.incoming);

    translation.validate = new ValidatorFactory(
      vv.outgoing.validators, vv.incoming.validators);
    return translation;
  };

  hd.isTranslation = function isTranslation(proxy) {
    return (hd.isVariable(proxy) && proxy.unwrap().incoming);
  };

  hd.isTranslator = hd.isTranslation;

}());

