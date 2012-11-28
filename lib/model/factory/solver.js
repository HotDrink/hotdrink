(function () {

  var Solver   = hd.__private.Solver;
  var Strength = Solver.Strength;
  var factory  = hd.__private.factory;

  /* If the variable is loose, claim it. If it is not loose, we better be the
   * owner or someone forgot to merge. Either way, add it to the given
   * constraint. */
  Solver.prototype.addVariable = function addVariable(cc, vv) {
    var vvv = vv.inner;

    if (!vvv) {
      ASSERT(!vv.writtenBy,
        "expected fresh variable (" + vv + ") for constraint (" + cc + ")");

      var mmStay = factory.addMethod(/*outputs=*/[vv], /*fn=*/undefined);
      mmStay.id = vv.id + "_const";

      var ccStay = factory.addConstraint(/*methods=*/[mmStay]);
      ccStay.id = vv.id + "_stay";
      var cccStay = this.addConstraint(ccStay, Strength.WEAKEST);

      vvv = new Solver.Variable(vv, cccStay);
      this.variables.push(vvv);
      this.priority.push(vvv);
      this.priority.sort(definedLater);

      LOG(vv + " added to solver");
    } else {
      ASSERT(vv.solver === this,
        "forgot to merge solver for " + vv);
    }

    vv.solver = this;

    var ccc = this.addConstraint(cc, Strength.REQUIRED);
    if (!ccc.variables.has(vvv)) {
      ccc.variables.push(vvv);
      vvv.constraints.push(ccc);
    }

    return vvv;
  };

  /* Just add each of its outputs. */
  Solver.prototype.addMethod = function addMethod(cc, mm) {
    ASSERT(!mm.isSelected,
      "expected fresh method (" + mm + ") in constraint (" + cc + ")");

    mm.outputs.forEach(function (ww) {
      this.addVariable(cc, ww);
    }, this);
  };

  Solver.prototype.addConstraint = function addConstraint(cc, strength) {
    var ccc = cc.inner;

    if (!ccc) {
      /* Default for user-defined constraints. */
      if (strength === undefined) {
        strength = Strength.REQUIRED;
      }

      ccc = new Solver.Constraint(cc, strength);
      this.constraints.push(ccc);

      if (strength === Strength.REQUIRED) {
        /* Need to enqueue our required constraints for the first solution.
         * The incremental solver will react to variable changes by directly
         * adding only stay constraints. */
        this.unenforcedCnsQueue.push(ccc);
      }

      LOG(cc + " added to constraint graph.");
    }

    return ccc;
  };

  var definedLater = function definedLater(vvva, vvvb) {
    return vvva.outer.orderNo - vvvb.outer.orderNo;
  };

  /* Eat another solver if it exists. */
  Solver.prototype.merge = function merge(other) {
    if (!other || other === this) {
      return;
    }

    Array.prototype.push.apply(this.variables, other.variables);
    /* We want a priority that reflects the variables' definition order. */
    this.priority = this.variables.slice();
    this.priority.sort(definedLater);
    other.variables.forEach(function (vvv) {
      vvv.outer.solver = this;
    }, this);
    other.variables = [];

    Array.prototype.push.apply(this.constraints, other.constraints);
    other.constraints = [];

    /* Have to do it this way so we don't add stay constraints. They will be
     * added on solve. */
    Array.prototype.push.apply(this.unenforcedCnsQueue, other.unenforcedCnsQueue);
    LOG("Merged two constraint graphs.");
  };

}());

