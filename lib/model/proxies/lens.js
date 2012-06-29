(function () {

  var proxies = hd.__private.proxies;

  var project = function project(valfn) {
    this.unwrap().translateFrom.validators.push(valfn);
    return this;
  };

  var reflect = function reflect(valfn) {
    this.unwrap().translateTo.validators.push(valfn);
    return this;
  };

  var number = function number(message) {
    this.unwrap().translateFrom.validators.push(toNum(message));
    this.unwrap().translateTo.validators.push(toString);
    return this;
  }

  proxies.makeLensProxy = function makeLensProxy(vv) {
    var proxy = proxies.makeVariableProxy(vv);
    proxy.project = project;
    proxy.reflect = reflect;
    proxy.number = number;
    return proxy;
  };

  function toNum(message) {
    return function toNum(value) {
      var num = Number(value);
      if (isNaN(num)) {
        return message ? {error: message}
                       : {error: 'could not convert to number: ' + JSON.stringify(value)};
      }
      else {
        return {value: num};
      }
    }
  }

  function toString(value) {
    if (value === null || value == 'undefined') return {value: ''};
    return {value: value.toString()};
  }

})();