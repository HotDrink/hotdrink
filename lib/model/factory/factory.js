/**
 * @fileOverview <p>{@link hotdrink.model.Factory}</p>
 * @author John Freeman
 */

//provides("hotdrink.model.Factory");

(function () {

  /***************************************************************/
  /* Initialization. */

  var Factory = function Factory() {
    this.runtime = new hotdrink.model.Runtime();
    this.behaviors = [];

    //this.variables = [];
    this.methods = [];
    //this.constraints = [];
    this.isGathering = true;

  };

  /***************************************************************/

  /* A behavior can do three things. These hooks are intended to support a
   * wide range of rich behaviors. They should be used to perform
   * behavior-specific computations.
   *   1. Extend the Factory with new constructs.
   *   2. Initialize each variable.
   *   3. After evaluation, use the touchedSet, newMethods, droppedInputs, and
   *      changedSet to update the model and notify subscribers.
   */
  Factory.prototype.behavior = function behavior(behavior) {
    ASSERT(!contains(this.behaviors, behavior),
      "you already added that behavior");
    this.behaviors.push(behavior);
    this.runtime.subscribe(behavior);
    if (behavior.extend) behavior.extend(this);
  };

  Factory.prototype.update = function update() {
    this.runtime.update();
  };

  /***************************************************************/
  /* Helpers. */

  Factory.prototype.isVariable = hotdrink.isVariable;
  Factory.prototype.isCommand = hotdrink.isCommand;

  namespace.open("hotdrink.model").Factory = Factory;

}());

