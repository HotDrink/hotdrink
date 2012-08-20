(function () {

  var proxies = hd.__private.proxies;
  var factory = hd.__private.factory;

  factory.scratch = function scratch(target, error) {
    var vvScratch = factory.addVariable("interface");

    if (!error) {
      var vvError = factory.addVariable("interface");
      error = proxies.makeVariableProxy(vvError);
    }

    return proxies.makeScratchProxy(vvScratch, target, error);
  };

  hd.scratch = factory.scratch;

}());