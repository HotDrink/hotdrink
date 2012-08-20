(function () {

  var proxies = hd.__private.proxies;
  var factory = hd.__private.factory;

  factory.translation = function translation(target, error) {
    var vv = factory.addVariable("interface");

    if (!error) {
      var vvError = factory.addVariable("interface");
      error = proxies.makeVariableProxy(vvError);
    }

    return proxies.makeTranslationProxy(vv, target, error);
  };

  hd.translation = factory.translation;
  hd.translator = factory.translation;

}());