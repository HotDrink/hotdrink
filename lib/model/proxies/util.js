(function () {

  var util = hd.util = {};

  /*********************************************************
   * required
   */

  var required1 = function required1(errval) {
    return function checkRequired(value) {
      if (value === undefined || value === null)
        return {error: errval};
      if (typeof value === "string" && value.search(/\S/) < 0)
        return {error: errval};
      return {};
    };    
  };

  var requiredDefault = required1("Required");

  util.required = function required(errval) {
    if (errval === undefined) return requiredDefault
    else return required1(errval);
  };

  /*********************************************************
   * defaultValue
   */

  util.defaultValue = function defaultValue(defval) {
    return function convertDefaultValue(value) {
      if (value === undefined || value === null)
        return {value: defval};
      if (typeof value === "string" && value.search(/\S/) < 0)
        return {value: defval};
      return {};
    }
  }

  /*********************************************************
   * trim
   */

  var convertTrim = function convertTrim(value) {
    if (typeof value === "string") {
      var trimmed = value.trim()
      return {value: trimmed};
    }
    return {};
  }

  util.trim = function trim() {
    return convertTrim;
  }

  /*********************************************************
   * match
   */

  util.match = function match(pattern, errval) {
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

  /*********************************************************
   * toNum
   */

  var toNum1 = function toNum1(errval) {
    return function convertToNum(value) {
      var num = Number(value);
      if (isNaN(num))
        return {error: errval};
      else
        return {value: num};
    };
  }

  var toNumDefault = toNum1("Invalid number");

  util.toNum = function toNum(errval) {
    if (errval === undefined) return toNumDefault;
    else return toNum1(errval);
  }

  /*********************************************************
   * toString
   */

  var convertToString = function convertToString(value) {
    if (value === undefined || value === null) return '';
    return {value: value.toString()};
  };

  util.toString = function toString() {
    return convertToString;
  }


  /*********************************************************
   * min
   */

  util.min = function min(minval, errval) {
    if (errval === undefined)
      errval = "Must be at least " + minval;

    return function checkMin(value) {
      ASSERT(typeof value === "number", "expected number");
      if (value < minval)
        return {error: errval};
      return {};
    };
  }

  /*********************************************************
   * max
   */

  util.max = function max(maxval, errval) {
    if (errval === undefined)
      errval = "Must be at most " + maxval;

    return function checkMax(value) {
      ASSERT(typeof value === "number", "expected number");
      if (value > maxval)
        return {error: errval};
      return {};
    };
  }

  /*********************************************************
   * range
   */

  util.range = function range(minval, maxval, errval) {
    if (errval === undefined)
      errval = "Must be between " + minval + " and " + maxval;

    return function checkRange(value) {
      ASSERT(typeof value === "number", "expected number");
      if (value < minval || value > maxval)
        return {error: errval};
      return {};
    };
  }

  /*********************************************************
   * toDate
   */

  var toDate1 = function toDate1(errval) {
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

  var toDateDefault = toDate1("Invalid date");

  util.toDate = function toDate(errval) {
    if (errval === undefined) return toDateDefault;
    else return toDate1(errval);
  }

  /*********************************************************
   * dateToString
   */

  var convertDateToString = function converDateToString(value) {
    ASSERT(value instanceof Date, "expected date");
    return { value: value.toLocaleDateString() };
  };

  util.dateToString = function dateToString() {
    return convertDateToString;
  }

}());
