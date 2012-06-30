(function () {

  var proxies = hd.__private.proxies;

  function project(valfn) {
    this.unwrap().translateFrom.validators.push(valfn);
    return this;
  };

  function reflect(valfn) {
    this.unwrap().translateTo.validators.push(valfn);
    return this;
  };

  function number(errval) {
    if (errval === undefined)
      errval = "Invalid number";

    var toNum = function toNum(value) {
      var num = Number(value);
      if (isNaN(num)) {
        return {error: errval}
      }
      else {
        return {value: num};
      }
    };

    var toString = function toString(value) {
      if (value === null || value == 'undefined') return {value: ''};
      return {value: value.toString()};
    };

    var vv = this.unwrap();
    vv.translateFrom.validators.push(toNum);
    vv.translateTo.validators.push(toString);
    return this;
  }

  function required(errval) {
    if (errval === undefined)
      errval = "Required";

    var checkRequired = function checkRequired(value) {
      if (value === undefined || value === null)
        return {error: errval};
      if (typeof value == "string" && value == "")
        return {error: errval};
      return {};
    };

    this.unwrap().translateFrom.validators.push(checkRequired);
    return this;
  }

  function range(min, max, errval) {
    if (errval === undefined)
      errval = "Must be between " + min + " and " + max;

    var checkRange = function checkRange(value) {
      ASSERT(typeof value === "number", "expected number");
      if (value < min || value > max)
        return {error: errval};
      return {};
    };

    this.unwrap().translateFrom.validators.push(checkRange);
    return this;
  }

  function match(pattern, errval) {
    if (errval == undefined)
      errval = "Does not match expected pattern";

    var checkMatch = function checkMatch(value) {
      ASSERT(typeof value === "string", "exptected string");
      if (value === undefined || value === null || value === '')
        return {}
      if (value.search(pattern) < 0)
        return {error: errval};
      else
        return {};
    };

    this.unwrap().translateFrom.validators.push(checkMatch);
    return this;
  }

  proxies.makeLensProxy = function makeLensProxy(vv) {
    var proxy = proxies.makeVariableProxy(vv);
    proxy.project = project;
    proxy.reflect = reflect;
    proxy.number = number;
    proxy.required = required;
    proxy.range = range;
    proxy.match = match;
    return proxy;
  };

  function makeToNum(errval) {
  }


  function makeCheckRequired(errval) {
  }

})();