/**
 * @fileOverview <p>{@link hotdrink.model.Factory}</p>
 * @author John Freeman
 */

//provides("hotdrink.model.Factory");

(function () {

  var Factory = hotdrink.model.Factory;

  /***************************************************************/
  /* Helpers. */

  Factory.prototype.addVariable = function addVariable(cellType, initialValue) {
    var vv = new hotdrink.model.Variable(cellType, initialValue);
    //if (this.isGathering) this.variables.push(vv);
    this.runtime.touch(vv);
    this.behaviors.forEach(function (behavior) {
      if (behavior.variable) behavior.variable(vv);
    });
    return vv;
  };

  Factory.prototype.addMethod = function addMethod(outputs, fn) {
    var mm = new hotdrink.model.Method(outputs, fn);
    if (this.isGathering) this.methods.push(mm);
    return mm;
  };

  Factory.prototype.addConstraint = function addConstraint(methods) {
    var cc = new hotdrink.model.Constraint(methods);
    //if (this.isGathering) this.constraints.push(cc);
    return cc;
  };

  Factory.prototype.addBinding = function addBinding(options) {
    var bb = new hotdrink.model.Binding(options);
    return bb;
  }

  /***************************************************************/
  /* Variables. */

  /* Does everything but create the proxy. Allows us to create different
   * proxies for different types of variables. */
  Factory.prototype.addComputedVariable
    = function addComputedVariable(cellType, fn)
  {
    var initialValue = undefined;
    var vv = this.addVariable(cellType, initialValue);
    vv.dependsOnSelf = true;
    this.addOneWayConstraint([vv], fn);

    return vv;
  };

  /* Create a new one-way constraint.
   *
   * Note: There is no actual constraint, just a single method. */
  Factory.prototype.addOneWayConstraint
    = function addOneWayConstraint(outputs, fn)
  {
    var mm = this.addMethod(outputs, fn);
    this.setOneWayConstraint(mm);
    return mm;
  };

  /* Make an existing constraint one-way. */
  Factory.prototype.setOneWayConstraint = function setOneWayConstraint(mm) {
    /* Optimization: no constraint, no solver, fixed solution. */
    mm.isSelected = true;
    mm.needsExecution = true;
    //delete mm.constraint;
    mm.outputs.forEach(function (ww) {
      ww.writtenBy = mm;
    });
  };

  /* Make an existing constraint multi-way. */
  Factory.prototype.setMultiWayConstraint = function setMultiWayConstraint(mm, cc) {
    delete mm.isSelected;
    delete mm.needsExecution;
    mm.constraint = cc;
    mm.outputs.forEach(function (ww) {
      delete ww.writtenBy;
    });
  };

}());

