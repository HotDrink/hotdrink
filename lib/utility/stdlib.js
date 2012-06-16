(function () {

  /************************************/
  /* Primitive functions. */

  var empty    = function empty() {};
  var identity = function identity(x) { return x; };

  /************************************/
  /* Object. */

  /* Credit to David Coallier:
   * http://onemoredigit.com/post/1527191998/extending-objects-in-node-js
   */
  Object.defineProperties(Object.prototype, {
    "extend": {
      enumerable: false,
      value: function extend(from, names) {
        var names = names || Object.getOwnPropertyNames(from);
        names.forEach(function (name) {
          if (!(this.hasOwnProperty(name))) {
            var prop = Object.getOwnPropertyDescriptor(from, name);
            Object.defineProperty(this, name, prop);
          }
        });
        return this;
      }
    },
    "extract": {
      enumerable: false,
      value: function extract(names) {
        return {}.extend(this, names);
      }
    }
  });

  Object.defineProperties(Object, {
    "extend": {
      enumerable: false,
      value: function extend(to, from, names) {
        return to.extend(from, names);
      }
    },
    "extract": {
      enumerable: false,
      value: function extract(from, names) {
        return from.extract(names);
      }
    }
  });

  /************************************/
  /* Array. */

  Object.defineProperties(Array.prototype, {
    "has": {
      enumerable: false,
      value: function has(a) {
        return this.indexOf(a) >= 0;
      }
    },
    "remove": {
      enumerable: false,
      value: function remove(/*...*/) {
        Array.prototype.slice.call(arguments)
          .map(function (a) { return this.indexOf(a); }, this)
          .filter(function (i) { return i >= 0; })
          .forEach(function (i) { this.splice(i, 1); }, this);
        return this;
      }
    },
  });

  /************************************/
  /* Set. */

  Object.defineProperties(Array.prototype, {
    "setSubtract": {
      enumerable: false,
      value: function setSubtract(as) {
        return this.filter(function (a) { return !as.has(a); });
      }
    },
    "setUnion": {
      enumerable: false,
      value: function setUnion(as) {
        return this.concat(as.setSubtract(this));
      }
    },
    "setIntersect": {
      enumerable: false,
      value: function setIntersect(as) {
        return this.filter(function (a) { return as.has(a); });
      }
    },
    "setInsert": {
      enumerable: false,
      value: function setInsert(a) {
        if (!this.has(a)) this.push(a);
        return this;
      }
    }
  });

  /************************************/
  /* Priority queue. */

  Object.defineProperties(Array.prototype, {
    "pqMin": {
      enumerable: false,
      value: function pqMin(keyOf) {
        if (!this.length) return -1;
        keyOf = keyOf || identity;
        
        var imin = 0;
        var amin = keyOf(this[0]);
        for (var i = 1; i < this.length; ++i) {
          var a = keyOf(this[i]);
          if (a < amin) {
            amin = a;
            imin = i;
          }
        }
        
        return imin;
      }
    },
    "pqMax": {
      enumerable: false,
      value: function pqMax(keyOf) {
        if (!this.length) return -1;
        keyOf = keyOf || identity;
        
        var iMax = 0;
        var aMax = keyOf(this[0]);
        for (var i = 1; i < this.length; ++i) {
          var a = keyOf(this[i]);
          if (a > aMax) {
            aMax = a;
            iMax = i;
          }
        }
        
        return iMax;
      }
    },
    "pqPopMin": {
      enumerable: false,
      value: function pqPopMin(keyOf) {
        var i = this.pqMin(keyOf);
        if (i < 0) return null;
        var a = this[i];
        this.splice(i, 1);
        return a;
      }
    },
    "pqPopMax":  {
      enumerable: false,
      value: function pqPopMax(keyOf) {
        var i = this.pqMax(keyOf);
        if (i < 0) return null;
        var a = this[i];
        this.splice(i, 1);
        return a;
      }
    }
  });

  /************************************/
  /* Miscellaneous. */

  var submitForm = function submitForm(url, data) {
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
  var debounce = function debounce(func, threshold, execAsap) {
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

  Object.extend(window, {
    empty:      empty,
    identity:   identity,
    submitForm: submitForm,
    debounce:   debounce
  });

}());

