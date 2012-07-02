(function () {

  var proxies = hd.__private.proxies;
  var validators = hd.validators;

  var template = {};

  template.outgoing = function outgoing(valfn) {
    this.unwrap().translateFrom.validators.push(valfn);
    return this;
  };

  template.incoming = function incoming(valfn) {
    this.unwrap().translateTo.validators.push(valfn);
    return this;
  };

  template.surround = function layer(outfn, infn) {
    var vv = this.unwrap();
    vv.translateFrom.validators.unshift(outfn);
    vv.translateTo.validators.push(infn);
    return this;
  }

  template.required = function required(errval) {
    return this.outgoing(validators.required(errval));
  }

  template.defaultValue = function defaultValue(defval) {
    return this.outgoing(validators.defaultValue(defval));
  }

  template.match = function match(pattern, errval) {
    return this.outgoing(validators.match(pattern, errval));
  }

  template.number = function number(errval) {
    return this.outgoing(validators.toNum(errval))
               .incoming(validators.toString(errval));
  }

  template.min = function min(minval, errval) {
    return this.outgoing(validators.min(minval, errval));
  }

  template.max = function max(maxval, errval) {
    return this.outgoing(validatros.max(maxval, errval));
  }

  template.range = function range(minval, maxval, errval) {
    return this.outgoing(validators.range(minval, maxval, errval));
  }

  template.date = function date(errval) {
    return this.outgoing(validators.toDate(errval))
               .incoming(validators.dateToString(errval));
  }

  proxies.makeLensProxy = function makeLensProxy(vv) {
    var proxy = proxies.makeVariableProxy(vv);
    for (method in template)
      proxy[method] = template[method];
    return proxy;
  };

})();