(function () {

  var proxies = hd.__private.proxies;
  var factory = hd.__private.factory;

  var Translation = function Translation(source) {
    this.source = source;
    this.validators = [];
    this.fn = translate.bind(this);
    return this;
  }

  var translate = function translate() {
    var value = this.source();
    var error = null;
    var validators = this.validators;
    for (var i = 0; error === null && i < validators.length; ++i) {
      var result = validators[i](value);
      if ('error' in result) {
        value = undefined;
        error = result.error;
      }
      else if ('value' in result) {
        value = result.value;
      }
    }
    return [value, error];
  }

  /************************************/

  factory.scratch = function scratch(target, error) {
    var scratchVar = this.addVariable("interface");
    var scratch = proxies.makeScratchProxy(scratchVar);

    if (error) {
      ASSERT(hd.isProxy(error), "expected proxy");
    }
    else {
      var errorVar = this.addVariable("interface");
      error = proxies.makeVariableProxy(errorVar);
    }

    ASSERT(hd.isProxy(target), "expected proxy");
    var targetVar = target.unwrap();
    if (targetVar.error === undefined)
      targetVar.error = error;

    scratchVar.error = error;
    scratchVar.translateFrom = new Translation(scratch);
    scratchVar.translateTo = new Translation(target);

    hd.constraint([scratch, target, error])
      .method([target, error], scratchVar.translateFrom.fn)
      .method([scratch, error], scratchVar.translateTo.fn);

    return scratch;
  }

  hd.scratch = factory.scratch.bind(factory);

})();