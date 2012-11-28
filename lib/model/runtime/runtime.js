(function () {

  var evaluator = hd.__private.evaluator;

  /*****************************/
  /* Touch, set, get. */

  /**
   * List of variables that have been touched since the last call to
   * update. A touch marks an edit whether the value has changed or not,
   * and it is used to signal a desire to change the dataflow and notify
   * observers. The user can set multiple variables before updating, so we
   * need to keep track of all changes.
   *
   * For the first call to update, this should contain the names of all
   * variables. Add them when they are constructed.
   */
  var touchedSet = [];

  /**
   * List of methods that must be executed during the next evaluation.
   * Generally, it will include methods that are new in the solution.
   */
  var newMethods = [];

  var touch = function touch(vv) {
    if (evaluator.isUpdating()) return;

    LOG("touched " + vv);
    touchedSet.setInsert(vv);

    if (vv.solver) {
      vv.solver.promote(vv);
      LOG("promoted " + vv);
    }

    updateLater();
  };

  var enqueue = function enqueue(mm) {
    LOG("enqueued " + mm);
    newMethods.setInsert(mm);
    updateLater();
  };

  /*****************************/
  /* Update. */

  var updateTask = null;

  var updateLater = function updateLater() {
    if (!updateTask) {
      updateTask = setTimeout(update, 0);
    }
  };

  var update = function update() {
    /* Flush the update. */
    ASSERT(updateTask,
      "expected an update to be scheduled after touching");
    clearTimeout(updateTask);
    updateTask = null;

    /* Skip if we can. */
    if (!touchedSet.length && !newMethods.length) {
      return;
    }

    LOG("Updating...");

    touchedSet.forEach(function (vv) {
      LOG(vv + " is " + ((vv.solver) ? ("") : ("not ")) +
          "attached to multi-way constraints");

      if (vv.solver) {
        var changes = vv.solver.solve();
        if (changes) {
          Array.prototype.push.apply(newMethods, changes.added);

          changes.removed.forEach(function (mm) {
            mm.outputs.forEach(function (ww) {
              ww.dependsOnSelf = false;
            });
            /* TODO: Clear `usedBy`/`inputsUsed` connections as well? */
          });
        }
      }

      var mm = vv.writtenBy;
      if (mm && vv.dependsOnSelf) {
        newMethods.setInsert(mm);
      }
    });

    var executedSet = [];
    var changedSet = [];
    evaluator.update(touchedSet, newMethods, executedSet, changedSet);

    LOG("touchedSet = " + touchedSet);
    LOG("newMethods = " + newMethods);
    LOG("executedSet = " + executedSet);
    LOG("changedSet = " + changedSet);

    hd.behaviors.forEach(function (behavior) {
      /* Global behaviors can only update. If they don't have an update, then
       * they shouldn't be global. */
      ASSERT(behavior.update, "expected update for global behavior");
      behavior.update(
        touchedSet, executedSet, changedSet, evaluator.getTimestamp());
    });

    touchedSet = [];
    newMethods = [];
    LOG("Finished update.");

    changedSet.forEach(function (vv) {
      vv.publishAll();
    });
  };

  /*****************************/
  /* Exports. */

  hd.__private.runtime = {
    touch:      touch,
    enqueue:    enqueue
  };

  hd.update    = update;
  hd.behaviors = [];

}());

