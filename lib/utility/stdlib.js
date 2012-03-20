/************************************/
/* Primitive functions. */

Object.extend = function extend(a, b) {
  Object.keys(b).forEach(function (name) {
    a[name] = b[name];
  });
};

Object.extract = function extract(o, names) {
  var result = {};
  names.forEach(function (name) {
    result[name] = o[name];
  });
  return result;
};

var empty = function empty() {};
var identity = function identity(x) { return x; };

/************************************/
/* Priority queue. */

function findMinIndex(as, fn) {
  if (!as || as.length === 0) {
    return -1;
  }
  
  fn = fn || identity;
  
  var iMin = 0;
  var aMin = fn(as[0]);
  for (var i = 1; i < as.length; ++i) {
    var a = fn(as[i]);
    if (a < aMin) {
      aMin = a;
      iMin = i;
    }
  }
  
  return iMin;
}

function findMaxIndex(as, fn) {
  if (!as || as.length === 0) {
    return -1;
  }
  
  fn = fn || identity;
  
  var iMax = 0;
  var aMax = fn(as[0]);
  for (var i = 1; i < as.length; ++i) {
    var a = fn(as[i]);
    if (a > aMax) {
      aMax = a;
      iMax = i;
    }
  }
  
  return iMax;
}

function extractMin(as, fn) {
  var i = findMinIndex(as, fn);
  if (i === -1) return null;
  
  var a = as[i];
  as.splice(i, 1);
  
  return a;
}

function extractMax(as, fn) {
  var i = findMaxIndex(as, fn);
  if (i === -1) return null;
  
  var a = as[i];
  as.splice(i, 1);
  
  return a;
}

/************************************/
/* Array as Set. */

var contains = function contains(as, a) {
  return as.indexOf(a) >= 0;
};

var setDifference = function setDifference (as, bs) {
  return as.filter(function (a) { return !contains(bs, a); });
};

var setUnion = function setUnion(as, bs) {
  return as.concat(setDifference(bs, as));
};

var setIntersect = function setIntersect(as, bs) {
  return as.filter(function (a) { return contains(bs, a); });
};

var uniq = function uniq(as) {
  var bs = [];
  as.reduce(function (prev, next) {
    if (next !== prev) bs.push(next);
    return next;
  }, undefined);
  return bs;
};

var remove = function remove(as, a) {
  var i = as.indexOf(a);
  if (i >= 0) {
    as.splice(i, 1);
  }
};

var Set = {};

Set.insert = function insert(xs, x) {
  if (!contains(xs, x)) xs.push(x);
};

/************************************/
/* Miscellaneous. */

var submitForm = function (url, data) {
  var form = new Element("form", { action : url, method : "POST" });
  Object.keys(data).forEach(function (v) {
    var value = data[v];
    if (typeof value !== "string")
      value = JSON.stringify(value);
    var input = new Element("input",
      { type : "hidden", name : v, value : value });
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

DEBOUNCE_THRESHOLD = 100;

/**
 * @name debounce
 * @memberOf window
 * @description A good debouncing function. Credit to John Hann.
 * @public
 * @static
 * @function
 * @param {Function} func
 *   The function to debounce.
 * @param {Integer} [threshold=100]
 *   The maximum time, in milliseconds, between consecutive executions that
 *   should be considered the same execution.
 * @param {Boolean} [execAsap=false]
 *   Whether to execute the function at the beginning (true) or end (false) of
 *   the debouncing.
 * @returns {Function}
 *   The debounced function.
 */
var debounce = function (func, threshold, execAsap) {
  /* Default arguments. */
  if (typeof threshold === "undefined") threshold = DEBOUNCE_THRESHOLD;
  if (typeof execAsap === "undefined") execAsap = false;
  /* The handler from the last call to setTimeout. A null value indicates
   * debouncing has not begun anew yet. */
  var timeout = null;
  /* Return the debounced function. */
  return function debounced () {
    /* The debounced function captures its current context and arguments to be
     * passed to func later. */
    var context = this, args = arguments;
    /* This function will be executed at the end of debouncing. */
    function delayed () {
      /* If we chose to execute at the end of debouncing, then do it now. */
      if (!execAsap)
        func.apply(context, args);
      /* Indicate debouncing has ended. */
      timeout = null; 
    };
    /* If we're debouncing, clear the clock. We'll set it again later. */
    if (timeout)
      clearTimeout(timeout);
    /* Else we're starting debouncing, so if we chose to execute immediately,
     * then do it now. */
    else if (execAsap)
      func.apply(context, args);
    /* Set the clock. */
    timeout = setTimeout(delayed, threshold); 
  };
};

