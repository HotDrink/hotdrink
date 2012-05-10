(function () {

  /***************************************************************/
  /* Initialization. */

  hd.__private.factory = {
    methods:     [],
    isGathering: true
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
  //Factory.prototype.behavior = function behavior(behavior) {
    //assert(!contains(this.behaviors, behavior),
      //"you already added that behavior");
    //this.behaviors.push(behavior);
    //this.runtime.subscribe(behavior);
    //if (behavior.extend) behavior.extend(this);
  //};

}());

