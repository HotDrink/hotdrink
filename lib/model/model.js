/**
 * @fileOverview
 *   Base classes for variables, methods, and constraints. <br />
 *   {@link hotdrink.model.Variable} <br />
 *   {@link hotdrink.model.Method} <br />
 *   {@link hotdrink.model.Constraint}
 * @author John Freeman
 */

(function () {

  /************************************/
  /* Helpers. */

  var idNo = 0;

  var makeName = function makeName(kind) {
    if (idNo === Number.MAX_VALUE) idNo = 0;
    return "__" + kind + (idNo++);
  };

  /************************************/

  /**
   * A variable in the model.
   *
   * @memberOf hotdrink.model
   * @constructor
   * @param {concept.model.CellType} cellType 
   *   We need the cellType at construction time so that behaviors can
   *   differentiate variables.
   * @param {concept.model.Value} initialValue
   *   It is a good practice to intialize every variable. If this variable is
   *   part of a constraint, however, it may be overwritten during the first
   *   update.
   *   <br />
   *   If this is a function, then the variable will have a function value.
   */
  var Variable = function Variable(cellType, initialValue) {
    this.orderNo = idNo;
    this.id = makeName("variable");
    this.cellType = cellType;
    this.valuePrev = undefined;
    this.value = initialValue;
    /* TODO: Do we want to track this for resetting purposes? */
    //this.initialValue = initialValue;
    this.hasBeenEdited = false;
    this.usedBy = [];

    publisher.initialize(this);
  };

  var toId = function toId() { return this.id; };

  /**
   * @methodOf hotdrink.model.Variable#
   * @returns {String}
   *   Shows name and abbreviated {@link concept.model.cellType}.
   */
  Variable.prototype.toString = function () {
    return this.id + " (" + this.cellType.slice(0, 3) + ")";
  };

  /**
   * @methodOf hotdrink.model.Variable#
   * @returns {Object}
   *   A simplified object with just the fields to be JSONified.
   */
  Variable.prototype.toJSON = function () {
    return Object.extract(this, ["id", "cellType"]);
  };

  publisher.mixin(Variable);

  /**
   * @methodOf hotdrink.model.Variable#
   * @param {hotdrink.model.Runtime} runtime
   * @returns {concept.model.Proxy}
   */
  Variable.prototype.toProxy = function toProxy(runtime) {
    var vv = this;

    if (this.cellType === "interface" || this.cellType === "logic") {
      var proxy = function () {
        if (arguments.length > 0) {
          runtime.set(vv, arguments[0]);
        } else {
          return runtime.getVariable(vv);
        }
      };

    } else if (this.cellType === "output") {
      /* Same dangers in calling this as in accessing computed variables:
       * better to wait until the model is updated. */
      var proxy = function () {
        return runtime.getCommand(vv, this, arguments);
      };

    } else {
      ERROR("no proxy available for " + this.cellType + " variables");
    }

    return finishProxy(vv, proxy);
  };

  var finishProxy = function finishProxy(vv, proxy) {
    proxy.hotdrink = vv;
    proxy.getMore = function getMore() { return vv; };
    proxy.subscribe
      = function () { return vv.subscribe.apply(vv, arguments); };

    return proxy;
  };

  /**
   * @name is
   * @methodOf hotdrink.model.Variable
   * @param {Unknown} proxy
   * @returns {boolean} True if the argument is a {@link concept.model.Proxy}.
   */
  Variable.is = function is(proxy) {
    return (typeof proxy === "function") && (proxy.hotdrink);
  };

  /**
   * @lends hotdrink
   */
  namespace.extend("hotdrink", {

    /**
     * @param {Unknown} getter
     * @returns {boolean}
     *   True if the argument is a {@link concept.model.Proxy} for a
     *   {@link hotdrink.model.Variable} that is not a
     *   {@link concept.model.Command}.
     */
    isVariable : function isVariable(getter) {
      return Variable.is(getter) && (getter.hotdrink.cellType !== "output");
    },

    /**
     * @param {Unknown} getter
     * @returns {boolean}
     *   True if the argument is a {@link concept.model.Proxy} for a
     *   {@link hotdrink.model.Variable} that is a
     *   {@link concept.model.Command}.
     */
    isCommand : function isCommand(getter) {
      return Variable.is(getter) && (getter.hotdrink.cellType === "output");
    },

    /**
     * @param {Unknown} obj
     * @returns {boolean}
     *   True if the argument is a binding object.
     */
    isBinding : function isBinding(obj) {
      return obj instanceof hotdrink.model.Binding;
    }

  });

  /************************************/

  /**
   * A method in the model.
   *
   * @memberOf hotdrink.model
   * @constructor
   * @param {[hotdrink.model.Variable]} outputs
   * @param {Function :: () -> [concept.model.Value]} fn
   *   The function that computes new values for the variables.
   *   <br />
   *   Methods may not set values for any variable in their function body; such
   *   values must be returned by the method, in the order matching that given
   *   for the outputs parameter.
   *   <br />
   *   Methods may use 'this' to access variables defined in their
   *   {@link concept.model.Model}.
   */
  var Method = function Method(outputs, fn) {
    this.id = makeName("method");
    this.outputs = outputs;
    this.fn = fn;
    this.inputsUsed = [];
    this.inputsUsedPrev = [];
  };

  /**
   * @methodOf hotdrink.model.Method#
   * @returns {String} Shows inputs and outputs.
   */
  Method.prototype.toString = function () {
    return "[" + this.inputsUsed + "] -> [" + this.outputs + "]";
  };

  /**
   * @methodOf hotdrink.model.Method#
   * @returns {Object}
   *   A simplified object with just the fields to be JSONified.
   */
  Method.prototype.toJSON = function () {
    return Object.extract(this, ["id", "outputs"]);
  };

  /************************************/

  /**
   * A constraint in the model.
   *
   * @memberOf hotdrink.model
   * @constructor
   * @param {[hotdrink.model.Method]} methods
   */
  var Constraint = function Constraint(methods) {
    this.id = makeName("constraint");
    this.methods = methods;
  };

  /**
   * @methodOf hotdrink.model.Constraint#
   * @returns {String} Shows the name.
   */
  Constraint.prototype.toString = toId;

  /**
   * @methodOf hotdrink.model.Constraint#
   * @returns {Object}
   *   A simplified object with just the fields to be JSONified.
   */
  Constraint.prototype.toJSON = function () {
    return Object.extract(this, ["id", "methods"]);
  }

  /************************************/

  /**
   * A binding of a view to a variable.
   *
   * @memberOf hotdrink.model
   * @constructor
   * @param {object} options
   */
  var Binding = function Binding(options) {
    if (typeof options === "object") {
      Object.extend(this, options);
    } else {
      this.value = options;
    }
    if (!("id" in this)) {
      this.id = makeName("binding");
    }
    publisher.initialize(this);
    this.error = makeProxy('error', function (a, b) { return a !== b; });
  }

  publisher.mixin(Binding);

  var makeProxy = function makeProxy(event, valueChange) {
    var value;
    return function proxy() {
      if (arguments.length == 0) {
        return value;
      }
      else if (valueChange(value, arguments[0])) {
        value = arguments[0];
        this.publish(event, value);
      }
    }
  }

  /**
   * @name hotdrink.model
   * @namespace For model data structures and algorithms.
   */
  namespace.extend("hotdrink.model", {
    Variable : Variable,
    Method : Method,
    Constraint : Constraint,
    Binding : Binding
  });

}());

