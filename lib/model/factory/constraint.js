/**
 * @fileOverview <p>{@link hotdrink.model.Factory}</p>
 * @author John Freeman
 */

//provides("hotdrink.model.Factory");

(function () {

  /***************************************************************/
  /* Constraints. */

  var ConstraintFactory = function ConstraintFactory(factory, variables) {
    /* Need this to continue tracking. */
    this.factory = factory;

    this.variables = variables;
    this.methods = [];
    this.cc = undefined;
    /* We might not ever use this. Oh well. :/ */
    this.solver = new hotdrink.model.Solver();
  };

  ConstraintFactory.prototype.method = function method(outputs, fn) {
    /* Provide short-cut for single output. */
    if (!Array.isArray(outputs)) outputs = [outputs];
    /* The user has access to proxies, but we want the variables. */
    outputs = outputs.map(function (proxy) {
      ASSERT(hotdrink.isVariable(proxy),
        "expected variable as output of method");
      return proxy.hotdrink;
    }, this);

    /* None of the outputs should belong to a fixed one-way constraint. */
    var isConflict = outputs.some(function (vv) {
      return (vv.cellType !== "interface");
    });
    ASSERT(!isConflict,
      "cannot add a method that outputs to computed variable");

    /* The first method makes us a one-way constraint unless some of our
     * outputs already belong to constraint graphs. We need to find out now if
     * we have a one-way constraint in case we need to make it multi-way
     * later. */
    var wasOneWayConstraint = (this.solver.constraints.length === 0);

    outputs.forEach(function (ww) {
      this.solver.merge(ww.solver);
    }, this);

    /* Create the method. */
    var mm = this.factory.addMethod(outputs, fn);
    /* This will add mm to this.cc.methods (if this.cc exists) since it shares
     * the same methods array. */
    this.methods.push(mm);

    /* Depending on the circumstances, we incorporate this method into a
     * constraint graph in different ways.
     *
     * If it does not attach to an existing constraint graph and it is alone,
     * then we can make a one-way constraint.
     * If later another method is added, then we have to change the constraint
     * from one-way to multi-way.
     * 
     * If it attaches to any number of existing constraint graphs, then merge
     * them. Otherwise, start a new one. */
    if (this.methods.length === 1) {

      /* If we already have a constraint graph, then this method writes to
       * variables that can be written by another method in the graph. If we
       * leave this as a one-way constraint, then that other method will never
       * have a chance of being selected. This is probably unintended, so we
       * set up a check for later. */
       if (this.solver.constraints.length > 0) {
         setTimeout(function () {
           ASSERT(mm.constraint && mm.constraint.methods.length > 1,
             "must add more than one method to constraint (" +
             mm.constraint + ")");
         }, 0);
       }

      this.factory.setOneWayConstraint(mm);

    } else {

      if (this.methods.length === 2) {
        /* Undo the one-way constraint we had tentatively created, and do what
         * we should have done. */
        this.cc = this.factory.addConstraint(this.methods);
        this.factory.setMultiWayConstraint(this.methods[0], this.cc);
        this.solver.addConstraint(this.cc);
        this.solver.addMethod(this.factory, this.cc, this.methods[0]);
        /* Now that we know we will use the solver, we can tag all the
         * variables. */
        this.variables.forEach(function (vv) {
          this.solver.addVariable(this.factory, this.cc, vv);
        }, this);
      }

      ASSERT(this.cc, "expected constraint to exist");
      ASSERT(contains(this.solver.constraints, this.cc.inner),
        "expected constraint to exist in the solver");

      mm.constraint = this.cc;
      this.solver.addMethod(this.factory, this.cc, mm);
    }

    /* Allow chaining. */
    return this;
  };

  hotdrink.model.Factory.prototype.constraint = function constraint(variables) {
    /* This parameter is optional in most cases. It is used to inform the
     * solver of variables that are input-only to this constraint. If the
     * solver does not know about them, it may choose a cyclic solution. */
    if (variables === undefined) variables = [];
    /* Provide short-cut for single variable. */
    if (!Array.isArray(variables)) variables = [variables];
    variables = variables.map(function (proxy) {
      ASSERT(hotdrink.isVariable(proxy),
        "expected variable as subject of constraint");
      return proxy.hotdrink;
    }, this);

    return new ConstraintFactory(this, variables);
  };

}());

