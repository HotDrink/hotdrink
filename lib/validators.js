(function () {

  var validators = hd.validators = {};

  validators.required = function required(errval) {
    if (errval === undefined)
      errval = "Required";

    return function checkRequired(value) {
      if (value === undefined || value === null)
        return {error: errval};
      if (typeof value === "string" && value == "")
        return {error: errval};
      return {};
    };    
  }

  validators.defaultValue = function defaultValue(defval) {
    return function defaultValue(value) {
      if (value === undefined || value === null)
        return {value: defval};
      if (typeof value === "string" && value == "")
        return {value: defval};
      return {};
    }
  }

  validators.match = function match(pattern, errval) {
    if (errval === undefined)
      errval = "Does not match expected pattern";

    return function checkMatch(value) {
      if (value === undefined || value === null || value == '')
        return {};
      ASSERT(typeof value === "string", "expected string");
      if (value.search(pattern) >= 0)
        return {};
      return {error: errval};
    };
  }

  validators.toNum = function toNum(errval) {
    if (errval === undefined)
      errval = "Invalid number";

    return function convertStringToNum(value) {
      var num = Number(value);
      if (isNaN(num))
        return {error: errval};
      else
        return {value: num};
    };
  }

  validators.toString = function toString() {
    return function convertToString(value) {
      if (value === undefined || value === null) return '';
      return {value: value.toString()};
    };
  }

  validators.min = function min(minval, errval) {
    if (errval === undefined)
      errval = "Must be at least " + minval;

    return function checkMin(value) {
      ASSERT(typeof value === "number", "expected number");
      if (value < minval)
        return {error: errval};
      return {};
    };
  }

  validators.max = function max(maxval, errval) {
    if (errval === undefined)
      errval = "Must be at most " + maxval;

    return function checkMax(value) {
      ASSERT(typeof value === "number", "expected number");
      if (value > maxval)
        return {error: errval};
      return {};
    };
  }

  validators.range = function range(minval, maxval, errval) {
    if (errval === undefined)
      errval = "Must be between " + minval + " and " + maxval;

    return function checkRange(value) {
      ASSERT(typeof value === "number", "expected number");
      if (value < minval || value > maxval)
        return {error: errval};
      return {};
    };
  }

  validators.toDate = function toDate(errval) {
    if (errval === undefined)
      errval = "Invalid date";

    return function convertStringToDate(value) {
      if (value === undefined || value === null || value === '') {
        var date = new Date();
      }
      else {
        var date = new Date(value);
      }

      if (isNaN(date.getTime()))
        return {error: errval};
      else
        return {value: date};
    };
  }

  validators.dateToString = function dateToString() {
    return function converDateToString(value) {
      ASSERT(value instanceof Date, "expected date");
      return { value: (value.getMonth() + 1) + "/" +
                      value.getDate() + "/" + value.getFullYear() };
    };
  }

}());