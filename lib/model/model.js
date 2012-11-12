(function () {

  /************************************/
  /* Helpers. */

  var idNo = 0;

  var makeName = function makeName(kind) {
    if (idNo === Number.MAX_VALUE) {
      idNo = 0;
    }
    return "__" + kind + (idNo++);
  };

  var toId = function toId() { return this.id; };

  /************************************/

  /**
   * A variable in the model.
   *
   * @memberOf hd.__private
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
    this.value = initialValue;
    /* TODO: Do we want to track this for resetting purposes? */
    //this.initialValue = initialValue;
    this.hasBeenEdited = false;
    this.usedBy = [];

    publisher.initialize(this);
  };

  publisher.mixin(Variable);

  Variable.prototype.isChanged = function isChanged() {
    return this.hasDraft("value");
  };

  /* The most basic mutation is an overwriting assignment. Richer operations
   * will need to decide for themselves (1) what constitutes a change and (2)
   * what information is needed to reproduce it. */
  Variable.prototype.set = function set(value) {
    if (value === this.value) {
      return;
    }
    ASSERT(!this.isChanged(), "overlapping writes");
    this.draft("value", {
      set: true,
      log: "set " + this + " : " + 
        ((typeof this.value === "function")
         ? "<function>" : JSON.stringify(this.value)) + " ==> " +
        ((typeof value === "function")
         ? "<function>" : JSON.stringify(value))
    });
    this.value = value;
  };

  Variable.prototype.publishChange = function publishChange() {
    ASSERT(this.isChanged(), "expected a change to publish");
    this.publish("value");
  };

  /**
   * @methodOf hd.__private.Variable#
   * @returns {String}
   *   Shows name and abbreviated {@link concept.model.cellType}.
   */
  Variable.prototype.toString = function toString() {
    return this.id + " (" + this.cellType.slice(0, 3) + ")";
  };

  /**
   * @methodOf hd.__private.Variable#
   * @returns {Object}
   *   A simplified object with just the fields to be JSONified.
   */
  Variable.prototype.toJSON = function toJSON() {
    return Object.extract(this, ["id", "cellType"]);
  };

  /************************************/

  /**
   * A method in the model.
   *
   * @memberOf hd.__private
   * @constructor
   * @param {[hd.__private.Variable]} outputs
   * @param {Function :: () -> [concept.model.Value]} fn
   *   The function that computes new values for the variables.
   *   <br />
   *   Methods may not set values for any variable in their function body;
   *   such values must be returned by the method, in the order matching
   *   that given for the outputs parameter.
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

  Method.prototype.toString = toId;

  /**
   * @methodOf hd.__private.Method#
   * @returns {String} Shows inputs and outputs.
   */
  Method.prototype.toSignature = function toSignature() {
    return this.id +
      " :: [" + this.inputsUsed + "] -> [" + this.outputs + "]";
  };

  /**
   * @methodOf hd.__private.Method#
   * @returns {Object}
   *   A simplified object with just the fields to be JSONified.
   */
  Method.prototype.toJSON = function toJSON() {
    return Object.extract(this, ["id", "outputs"]);
  };

  /************************************/

  /**
   * A constraint in the model.
   *
   * @memberOf hd.__private
   * @constructor
   * @param {[hd.__private.Method]} methods
   */
  var Constraint = function Constraint(methods) {
    this.id = makeName("constraint");
    this.methods = methods;
  };

  /**
   * @methodOf hd.__private.Constraint#
   * @returns {String} Shows the name.
   */
  Constraint.prototype.toString = toId;

  /**
   * @methodOf hd.__private.Constraint#
   * @returns {Object}
   *   A simplified object with just the fields to be JSONified.
   */
  Constraint.prototype.toJSON = function toJSON() {
    return Object.extract(this, ["id", "methods"]);
  };

  /**
   * @name hd.__private
   * @namespace For model data structures and algorithms.
   */
  hd.__private.makeName   = makeName;
  hd.__private.Variable   = Variable;
  hd.__private.Method     = Method;
  hd.__private.Constraint = Constraint;

}());

