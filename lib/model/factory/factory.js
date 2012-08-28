(function () {

  /***************************************************************/
  /* Initialization. */

  hd.__private.factory = {
    /* Set a sensible value for 'this' within methods, with a default context
     * for globals. */
    contexts: [{}]
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

}());

