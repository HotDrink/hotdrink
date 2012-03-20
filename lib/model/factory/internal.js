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

  /***************************************************************/
  /* Variables. */

  /* Does everything but create the proxy. Allows us to create different
   * proxies for different types of variables. */
  Factory.prototype.addComputedVariable
    = function addComputedVariable(cellType, fn)
  {
    var initialValue = undefined;
    try {
      /* We won't be able to call fn if it uses 'this' because we don't
       * have the context yet.
       *
       * Further, it won't be included in a planDiff because it is not
       * connected to a solver, but we need to execute it during an evaluation
       * phase to establish a usedBy connection with its inputs. We mark the
       * variable touched and dependsOnSelf to trick the runtime into
       * executing fn during the next evaluation phase. */
      initialValue = fn();
    } catch (e) {
      LOG("could not initialize computed variable");
    }

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

