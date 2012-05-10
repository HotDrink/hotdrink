(function () {

  var Solver   = hd.__private.Solver;
  var Strength = Solver.Strength;
  var Mark     = Solver.Mark;

  Solver.prototype.multiOutputPlanner = function multiOutputPlanner() {
    LOG("    MOP: constraint to enforce = " + this.cccToEnforce);
    LOG("    MOP: free variables = " + this.freeVariableSet);

    while (!this.cccToEnforce.isSatisfied()
           && this.freeVariableSet.length > 0)
    {
      /* Remove an arbitrary element from the free variable set. */
      var vvvFree = this.freeVariableSet.shift();

      if (vvvFree.isFree()) {
        /* ccc = the Constraint to which vvvFree belongs whose mark equals
         * this.mark.upstream. */
        var ccc = null;
        for (var i = 0; i < vvvFree.constraints.length; ++i) {
          var ccci = vvvFree.constraints[i];
          if (ccci.mark === this.mark.upstream) {
            ccc = ccci;
            break;
          }
        }

        LOG("    MOP: free variable " +
            ((vvvFree) ? (vvvFree) : ("(unknown)")) +
            " attached to " + ((ccc) ? (ccc) : ("nothing")));

        /* mSelected = the method in ccc with the smallest number of outputs
         * such that they are all free variables. */
        var mmSelected = null;
        var mmNumOutputs = Number.MAX_VALUE;
        ccc.outer.methods.forEach(function (mm) {
          /* If this method has more outputs, move on. */
          if (mm.outputs.length >= mmNumOutputs) return;
          /* If this method has all free outputs, then select it. */
          var isAllFree = mm.outputs.every(function (ww) {
            return ww.inner.isFree();
          }, this);
          if (isAllFree) {
            mmSelected = mm;
            mmNumOutputs = mm.outputs.length;
          }
        }, this);

        /* If there exists such a method, ... */
        if (mmSelected) {
          this.eliminateConstraint(ccc, mmSelected);

          /* A variable that cannot be made the output of a constraint and
           * which is marked 'potentially_undetermined' is a potential
           * undetermined variable. */
        } else if (vvvFree.mark === Mark.POTENTIALLY_UNDETERMINED) {
          this.potentialUndeterminedVars.push(vvvFree);
        }
      } else if (vvvFree.mark === Mark.POTENTIALLY_UNDETERMINED) {
        this.potentialUndeterminedVars.push(vvvFree);
      }
    }

    LOG("    MOP: enforced " + this.cccToEnforce + "? " +
        this.cccToEnforce.isSatisfied());
  };

  Solver.prototype.eliminateConstraint
    = function eliminateConstraint(ccc, mmNext)
  {
    LOG("      ELIMINATE: " + ((mmNext) ? ("eliminated") : ("retracted")));

    /* Any variable that is no longer output by ccc and which does not
     * become a free variable is a potential undetermined variable. */
    var mmPrev = ccc.outer.selectedMethod;
    var outputsPrev = (mmPrev) ? (mmPrev.outputs) : [];
    var outputsNext = (mmNext) ? (mmNext.outputs) : [];
    var newlyUndeterminedVars = setDifference(outputsPrev, outputsNext);

    newlyUndeterminedVars.forEach(function (vv) {
      var vvv = vv.inner;
      vvv.determinedBy = null;
      vv.writtenBy = null;
      /* When vvv.numConstraints === 2, v is attached to ccc and one other
       * constraint, meaning it will become a free variable. (It gets added to
       * the free variable queue after we decrement v.numConstraints later.)
       * We do not want to put free variables into the potentially undetermined
       * variables queue, so we check that v.numConstraints is greater than 2.
       */
      if (vvv.numConstraints > 2) {
        this.potentialUndeterminedVars.push(vvv);
      } else {
        vvv.mark = Mark.POTENTIALLY_UNDETERMINED;
      }
    }, this);

    /* A constraint can be removed from the set of unsatisfied
     * constraints by setting its mark field to Mark.UNKNOWN. */
    ccc.mark = Mark.UNKNOWN;

    /* We will keep track of mmPrev as ccc.outer.selectedMethodPrev, but we
     * will forget mmPrevPrev if we do not push it onto the undo stack. */
    var mmPrevPrev = ccc.outer.selectedMethodPrev;
    /* Keep track of redetermined constraints so they can be undone if
     * necessary. */
    this.undoStack.push([ccc, mmPrev, mmPrevPrev]);

    this.changeSelectedMethod(ccc, mmPrev, mmNext);

    ccc.variables.forEach(function (vvv) {
      --vvv.numConstraints;
      LOG("        variable " + vvv + " now has " +
          vvv.numConstraints + " constraints attached");
      if (vvv.isFree()) {
        LOG("          new free variable: " + vvv);
        this.freeVariableSet.push(vvv);
      }
    }, this);
  };

  Solver.prototype.constraintHierarchyPlanner
    = function constraintHierarchyPlanner(ceilingStrength)
  {
    LOG("  CHP: constraint to enforce = " + this.cccToEnforce);
    LOG("  CHP: retractable constraints = " + this.retractableCnsQueue);

    this.multiOutputPlanner();

    while (!this.cccToEnforce.isSatisfied()
           && this.retractableCnsQueue.length > 0)
    {
      var ccc = Strength.popWeakest(this.retractableCnsQueue);
      /* TODO: Unnecessary? */
      if (!Strength.isWeaker(ccc.strength, ceilingStrength)) continue;
      this.strongestRetractedStrength
        = Strength.pickStronger(this.strongestRetractedStrength, ccc.strength);
      this.eliminateConstraint(ccc, null);
      this.multiOutputPlanner();
    }
  };

  Solver.prototype.constraintHierarchySolver
    = function constraintHierarchySolver()
  {
    LOG("CHS: constraints to enforce = " + this.unenforcedCnsQueue);

    while (this.unenforcedCnsQueue.length > 0) {
      this.cccToEnforce = Strength.popStrongest(this.unenforcedCnsQueue);
      //if (this.cccToEnforce === Mark.UNKNOWN) continue;

      /* This heap uses Strength.popWeakest() in constraintHierarchyPlanner. */
      this.retractableCnsQueue = [];       // Heap<Constraint>
      this.freeVariableSet = [];           // Array<Variable>
      /* TODO: Make sure this is a set? */
      this.potentialUndeterminedVars = []; // Set<Variable>
      this.strongestRetractedStrength = Strength.WEAKEST;
      this.mark.nextUpstream();
      this.mark.nextDownstream();
      this.undoStack = [];                 // Stack<(Constraint, Method)>

      this.collectUpstreamConstraints(this.cccToEnforce);

      /* Cull from the free variable set variables that belong to more than one
       * constraint. */
      this.freeVariableSet = this.freeVariableSet.filter(function (vvv) {
        return vvv.isFree();
      });

      this.constraintHierarchyPlanner(this.cccToEnforce.strength);

      if (!this.cccToEnforce.isSatisfied()) {
        this.undo();
        continue;
      }

      /* Collect unenforced constraints only if a constraint was retracted. */
      if (Strength.isStronger(
            this.strongestRetractedStrength, Strength.WEAKEST))
      {
        /* Collect unenforced constraints that are downstream of either the
         * newly undetermined variables or the outputs of the newly enforced
         * constraint. */
        var undeterminedVars = []; // Array<Variable>
        this.potentialUndeterminedVars.forEach(function (vvv) {
          if (vvv.determinedBy === null) undeterminedVars.push(vvv);
        });
        this.freeVariableSet.forEach(function (vvv) {
          if (vvv.determinedBy === null
              && vvv.mark === Mark.POTENTIALLY_UNDETERMINED)
          {
            undeterminedVars.push(vvv);
          }
        });

        this.collectUnenforcedConstraints(undeterminedVars, this.cccToEnforce);
      }
    }
  };

  /**
   * This employs a depth-first search to collect all enforeced constraints that
   * are upstream of the constraint to be enforced.  This collects (1) weaker
   * upstream constraints that can be retracted, (2) computes the number of
   * upstream constraints to which each variable belongs, and (3) collects
   * potential free variables in the upstream component of the graph.
   * 
   * @param {Constraint} ccc
   */
  Solver.prototype.collectUpstreamConstraints
    = function collectUpstreamConstraints(ccc)
  {
    LOG("CUC: upstream from " + ccc);

    ccc.mark = this.mark.upstream;

    /* All upstream constraints weaker than the constraint to be enforced
     * should be added to the retractable constraints queue. */
    if (Strength.isWeaker(ccc.strength, this.cccToEnforce.strength)) {
      LOG("CUC: retractable constraint = " + ccc);
      this.retractableCnsQueue.push(ccc);
    }

    ccc.variables.forEach(function (vvv) {
      /* Computation of a variable's num_constraints field */
      if (vvv.mark === this.mark.upstream) {
        ++vvv.numConstraints;
      } else {
        vvv.mark = this.mark.upstream;
        vvv.numConstraints = 1;
      }

      var cccUp = vvv.determinedBy;
      if (cccUp && cccUp.mark !== this.mark.upstream) {
        this.collectUpstreamConstraints(cccUp);
      /* Input variables that are being visited for the first time and variables
       * that have not yet been visited by any constraint other than the
       * constraint that outputs them are potential free variables. */
      } else if (vvv.isFree()) {
        LOG("CUC: free variable = " + vvv);
        this.freeVariableSet.push(vvv);
      }
    }, this);

  };

  /**
   * Change the selectedMethod and selectedMethodPrev for a constraint.
   * @param {Constraint} ccc
   * @param {Method} mmPrevNew
   *   The method that will become the previously-selected method for this
   *   constraint. For new solutions, it will be the same as mmOld. When
   *   undoing changes, it will be the selectedMethodPrev we overwrote when
   *   making the changes.
   * @param {Method} mmNew
   *   The method that is to become selected.
   */
  Solver.prototype.changeSelectedMethod
    = function changeSelectedMethod(ccc, mmPrevNew, mmNew)
  {
    var mmOld = ccc.outer.selectedMethod;
    if (mmOld) {
      mmOld.isSelected = false;
      mmOld.outputs.forEach(function (ww) {
        ww.inner.determinedBy = null;
        ww.writtenBy = null;
      }, this);
    }

    if (mmNew) {
      mmNew.isSelected = true;
      mmNew.outputs.forEach(function (ww) {
        /* The output variables' determinedBy fields must be set so that
         * collectUpstreamConstraints can perform its reverse depth-first
         * search. */
        ww.inner.determinedBy = ccc;
        if (ccc.isRequired()) {
          ww.writtenBy = mmNew;
        }
      }, this);
    }

    ccc.outer.selectedMethodPrev = mmPrevNew;
    ccc.outer.selectedMethod = mmNew;

    LOG("        changing method for " + ccc +
        " to " + (mmNew ? mmNew : "(nothing)") +
        " from " + (mmOld ? mmOld : "(nothing)"));
  };

  Solver.prototype.undo = function undo() {
    while (this.undoStack.length > 0) {
      var item = this.undoStack.pop();
      var ccc = item[0];
      var mmPrev = item[1];
      var mmPrevPrev = item[2];
      var mmNext = ccc.outer.selectedMethod;

      this.changeSelectedMethod(ccc, mmPrevPrev, mmPrev);

      LOG("      UNDO");
    }
  };

  /**
   * Collect unenforced constraints.
   * This will populate unenforcedCnsQueue.
   *
   * @param {Variable[]} undeterminedVars
   * @param {Constraint} cccNewlyEnforced
   */
  Solver.prototype.collectUnenforcedConstraints
    = function collectUnenforcedConstraints(undeterminedVars, cccNewlyEnforced)
  {
    var mmNewlySelected = cccNewlyEnforced.outer.selectedMethod;
    mmNewlySelected.outputs.forEach(function (ww) {
      this.collectDownstreamUnenforcedConstraints(ww.inner);
    }, this);

    undeterminedVars.forEach(function (vvv) {
      this.collectDownstreamUnenforcedConstraints(vvv);
    }, this);
  };

  /**
   * Collects all unenforced constraints that are either attached to or
   * downstream of vvv and who are not stronger than the strongest retracted
   * constraint.
   *
   * @param {Variable} vvv
   */
  Solver.prototype.collectDownstreamUnenforcedConstraints
    = function collectDownstreamUnenforcedConstraints(vvv)
  {
    LOG("CDUC(" + vvv + ")");

    vvv.mark = this.mark.downstream;

    vvv.constraints.forEach(function (ccc) {
      if (!ccc.isSatisfied()) {
        if (!Strength.isStronger(
              ccc.strength, this.strongestRetractedStrength))
        {
          this.unenforcedCnsQueue.push(ccc);
          LOG("CDUC: unenforced constraint = " + ccc);
        }
        return;
      }

      if (ccc.mark !== this.mark.downstream) {
        ccc.mark = this.mark.downstream;
        ccc.outer.selectedMethod.outputs.forEach(function (ww) {
          var www = ww.inner;
          if (www.mark !== this.mark.downstream) {
            this.collectDownstreamUnenforcedConstraints(www);
          }
        }, this);
      }
    }, this);
  };

}());

