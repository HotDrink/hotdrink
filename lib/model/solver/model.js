(function () {

  var Solver   = hd.__private.Solver;
  var Strength = Solver.Strength;
  var Mark     = Solver.Mark;

  var toOuterId = function toOuterId() { return this.outer.id; };

  /***************************************************************/
  /* Variables. */

  var Variable = function Variable(vv, stayConstraint) {
    vv.inner = this;
    this.outer = vv;
    /* The constraints that may write to me. Be sure to include stay
     * constraints. */
    this.constraints = [stayConstraint];  // Array<Constraint>
    stayConstraint.variables.push(this);
    this.determinedBy = null;             // Constraint
    this.stayConstraint = stayConstraint; // Constraint

    /* These fields get reset each time solve() is called, so not important
     * to initialize them. */
    /* TODO: constraints doesn't change after initialization, but
     * numConstraints gets reset for every solve. Should we rename
     * numConstraints to something like numUnsatConstraints? */
    this.numConstraints = 0;
    this.mark = Mark.UNKNOWN;
  };

  Variable.prototype.toString = toOuterId;

  Variable.prototype.isFree = function isFree() {
    return this.numConstraints === 1;
  };

  /***************************************************************/
  /* Constraints. */

  var Constraint = function Constraint(cc, strength) {
    cc.inner = this;
    this.outer = cc;
    /* Variables to which I may write. */
    /* Need variable list for setting numConstraints,
     * need numConstraints for setting free variables,
     * only care about free variables that are outputs,
     * thus only need to add outputs to variable lists. */
    this.variables = [];          // Array<Variable>
    /* TODO: Expose strength in cc. */
    this.strength = strength;
    cc.selectedMethod = null;     // Method
    cc.selectedMethodPrev = null; // Method

    /* These fields get reset each time solve() is called, so not important
     * to initialize them. */
    this.mark = Mark.INITIAL_UPSTREAM;
  };

  Constraint.prototype.toString = toOuterId;

  Constraint.prototype.isRequired = function isRequired() {
    return this.strength === Strength.REQUIRED;
  };

  Constraint.prototype.isSatisfied = function isSatisfied() {
    return this.outer.selectedMethod !== null;
  };

  /***************************************************************/
  /* Exports. */

  Solver.Variable   = Variable;
  Solver.Constraint = Constraint;

}());

