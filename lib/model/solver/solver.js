(function () {

  /**
   * @class QuickPlan incremental solver.
   * @name hd.__private.Solver
   * @constructs
   */
  var Solver = function Solver() {
    this.priorityPrev = [];
    this.priority = [];
    this.planPrev = [];

    /* We can re-use a solution if the priority hasn't changed. */
    this.needsSolution = true;

    this.variables = [];
    this.constraints = [];

    /* This heap uses popStrongest() in constraintHierarchySolver. */
    this.unenforcedCnsQueue = [];        // Heap<Constraint>
    this.mark = new Solver.Mark();
    /* See constraintHierarchySolver for initialization of other members. */
  };

  /**
   * Promote a variable.
   * @param {Variable} vv
   */
  Solver.prototype.promote = function promote(vv) {
    var vvv = vv.inner;
    if (vvv !== this.priority[0]) {
      this.needsSolution = true;
      /* Promote this variable to highest priority. */
      this.priority.splice(this.priority.indexOf(vvv), 1);
      this.priority.unshift(vvv);
    }
  };

  /**
   * Solve the given constraint graph with variables priority.
   *
   * @param {String[]} priority Variable names in decreasing order of strength.
   * @returns {Object}
   *   Newly selected and unselected methods, or null if no changes.
   */
  Solver.prototype.solve = function solve() {
    /* Skip if we can. */
    if (!this.needsSolution) {
      LOG("Reusing last solution.");
      return null;
    }

    LOG("Solving...");

    /* After this loop, every variable in priority after index j will have the
     * same relative priority as in this.priorityPrev. The array slice of
     * priority up to index j should hold the promoted variables.
     *
     * Note: The promotedSet may differ from the touchedSet. The user may have
     * touched some variables without affecting their priority. */
    var j = this.priority.length - 1;
    var i;
    for (i = this.priorityPrev.length - 1; i >= 0; --i) {
      if (this.priorityPrev[i] === this.priority[j]) {
        --j;
      }
    }
    var promotedSet = this.priority.slice(0, j + 1);

    LOG("solve: priorityPrev = " + this.priorityPrev);
    LOG("solve: priority = " + this.priority);
    LOG("solve: promotedSet = " + promotedSet);

    /* TODO: This should be done outside the Solver so that clients can
     * control the solution. */
    this.priority.forEach(function (vvv, i) {
      vvv.stayConstraint.strength = i + 1;
    }, this);

    ASSERT(!this.unenforcedCnsQueue.length || this.planPrev.length === 0,
      "unenforcedCnsQueue should be non-empty only on the first solve");

    /* Try to change the solution so that we can enforce the stay constraints
     * of promoted variables. */
    promotedSet.forEach(function (vvv) {
      this.unenforcedCnsQueue.push(vvv.stayConstraint);
    }, this);

    this.constraintHierarchySolver();

    var plan = this.getPlan();
    ASSERT(plan.length > 0, "no solution found");
    LOG("solve: plan = " + plan);
    plan.forEach(function (mm) {
      INSPECT(mm);
    });

    var methodsAdded = plan.setSubtract(this.planPrev);
    LOG("solve: methodsAdded = " + methodsAdded);

    var methodsRemoved = this.planPrev.setSubtract(plan);
    LOG("solve: methodsRemoved = " + methodsRemoved);

    /* Prepare for the next solve. */
    this.needsSolution = false;
    this.priorityPrev = this.priority.slice();
    this.planPrev = plan;
    LOG("Finished solution.");

    return {
      added:   methodsAdded,
      removed: methodsRemoved
    };
  };

  /* Returns selected methods from satisfied, required constraints. */
  Solver.prototype.getPlan = function getPlan() {
    var result = [];
    Object.keys(this.constraints).forEach(function (c) {
      var ccc = this.constraints[c];
      LOG("GSM: constraint " + ccc.outer.id +
          ((ccc.isRequired()) ? (" (required)") : ("")) +
          " selected " + (ccc.outer.selectedMethod || "nothing"));
      if (ccc.isRequired() && ccc.isSatisfied()) {
        result.push(ccc.outer.selectedMethod);
      }
    }, this);
    return result;
  };

  hd.__private.Solver = Solver;

}());

