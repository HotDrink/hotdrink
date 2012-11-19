(function () {

  /* A timestamp identifies a particular evaluation phase.
   *
   * Variables and methods are marked with the last time they were updated.
   * Updated variables should not be `set` and updated methods should not be
   * `executed`.
   *
   * The timestamp is incremented by two for each evaluation. This lets us
   * have both "is updating" (timestamp) and "is updated" (timestamp + 1)
   * values for the marks.
   */
  var timestamp = 0;

  /* Note: `get`, which calls `maybeSet`, performs lazy evaluation. If these
   * functions are called before the variable in question has been updated,
   * then they will return only after executing the update. */

  /**
   * Perform lazy evaluation.
   */
  var maybeSet = function maybeSet(vv) {
    /* Mark variables as visited to cache result of lazy evaluation. */
    if (vv.lastUpdated >= timestamp) {
      LOG("maybeSet: " + vv + " already " +
        ((vv.lastUpdated === timestamp) ? "updating" : "updated"));
      return;
    }
    vv.lastUpdated = timestamp;

    LOG("maybeSet: " + vv);

    var mm = vv.writtenBy;
    if (mm) {
      LOG("maybeSet: " + vv + " written by " + mm);
      ASSERT(mm.outputs.has(vv),
        "maybeSet: " + vv + " not actually written by " + mm);
      maybeExecute(mm);
    } else {
      /* We will only check this once. */
      set(vv);
    }

    vv.lastUpdated = timestamp + 1;
  };

  /**
   * Execute the method if it is new in the solution or uses changed
   * variables.
   */
  var maybeExecute = function maybeExecute(mm) {
    /* Mark methods as visited to prevent double execution. */
    if (mm.lastUpdated >= timestamp) {
      LOG("maybeExecute: " + mm + " already " +
        ((mm.lastUpdated === timestamp) ? "updating" : "updated"));
      return;
    }
    mm.lastUpdated = timestamp;

    if (!mm.needsExecution) {
      ASSERT(mm.isSelected,
        "maybeExecute: do not call `maybeExecute` " +
        "with an unselected method, " + mm);
      /* We know here that this method is not new in the solution, so it has
       * valid inputsUsed. */
      /* Check for changed inputs. */
      mm.needsExecution = mm.inputsUsed.some(function (uu) {
        maybeSet(uu);
        return uu.lastChanged === timestamp;
      });
      LOG("maybeExecute: " + mm + " has " +
        (mm.needsExecution ? "" : "no ") + "changed inputs");
    } else {
      if (mm.lastNewMethod === timestamp) {
        LOG("maybeExecute: " + mm + " is a new method");
      } else {
        LOG("maybeExecute: " + mm +
          " depends on variable that just changed");
      }
    }

    if (mm.needsExecution) {
      /* Now that we have checked for both "is new method" and "has changed
       * inputs" conditions... */
      execute(mm);
    } else {
      LOG("maybeExecute: " + mm + " will not be executed");
    }

    mm.lastUpdated = timestamp + 1;
  };

  var executedSet = [];

  /* The method currently being executed. We need this to track
   * mm.usedInputs, vv.usedBy, and vv.dependsOnSelf. */
  var caller = null;

  var execute = function execute(mm) {
    LOG("execute: " + mm);

    ASSERT(mm.lastUpdated === timestamp,
      "execute: do not execute " + mm + " more than once");

    var callerSaved = caller;
    caller = mm;

    mm.inputsUsedPrev = mm.inputsUsed;
    mm.inputsUsed = [];
    /* Must remove myself from the usedBy of my former inputs. If they are
     * not changed during this evaluation, then they would be left with a
     * false positive if I failed to use them again. */
    mm.inputsUsedPrev.forEach(function (uu) {
      uu.usedBy.remove(mm);
    });

    var outputs = mm.outputs;
    outputs.forEach(function (ww) {
      ww.dependsOnSelf = false;
    });

    /* Methods in Models can use 'this' to get variables in the model.
     * Methods outside of models cannot use 'this', so it does not matter if
     * mm.context is undefined for them. */
    var results = mm.fn.call(mm.context);
    executedSet.push(mm);

    caller = callerSaved;
    mm.needsExecution = false;

    /* Write new values to outputs. Must do this before calling `set` in case
     * of diamond dependencies. A diamond dependency occurs when a method
     * writes multiple outputs that are read by another method. If we `set`
     * one of the outputs, the downstream method will `execute` and `get` the
     * other output(s), so they need to already have their new values
     * assigned. */
    if (typeof results !== "undefined") {

      if (outputs.length === 1) {
        LOG("execute: single output from " + mm + ":");
        LOG("execute:   " + outputs[0] + " = " + hd.toJSON(results));
        outputs[0].set(results);
      } else {
        ASSERT(Array.isArray(results),
          "execute: expected multi-output method, " + mm +
          ", to return array");
        ASSERT(results.length === outputs.length,
          "execute: expected " + mm + " to return array of size " +
          outputs.length + ", not " + results.length);
        LOG("execute: multiple outputs (" + results.length +
          ") from " + mm + ":");
        outputs.forEach(function (vv, i) {
          LOG("execute:   " + vv + " = " + hd.toJSON(results[i]));
          vv.set(results[i]);
        });
      }

    }

    /* Notify their subscribers. */
    outputs.forEach(function (vv) { set(vv); });
  };

  var get = function get(vv) {
    LOG("get: " + vv);

    if (caller === vv.writtenBy) {
      vv.dependsOnSelf = true;
      /* Break cycle by returning old value. */
      LOG("get: return last " + vv + " == " + JSON.stringify(vv.value));
      /* Return the last value the user assigned. We do not want to call
       * `set` with a value that will be overwritten (leading to two calls to
       * `set` with new values), but we do want to call `set` once with the
       * overwriting value. 
       * In the case where the overwriting value would be the same as what
       * the user assigned, then we would not call `set` at all if we copied
       * the user's value over to valuePrev. */
      return vv.value;
    }

    maybeSet(vv);

    if (caller) {
      /* Do not establish this link between a variable and its writer, i.e.,
       * for self-loops. We want to guarantee that there are no cycles in the
       * graph when traversing `inputsUsed` and `writtenBy` edges. */
      caller.inputsUsed.setInsert(vv);
      vv.usedBy.setInsert(caller);
    }

    LOG("get: return " + vv + " == " + JSON.stringify(vv.value));
    return vv.value;
  };

  var changedSet     = [];
  var executionQueue = [];

  var set = function set(vv) {
    LOG("set: " + vv);

    /* Do not notify anyone if our value did not actually change. */
    if (!vv.isChanged()) {
      /* If this variable is computed, then `set` will be called only by its
       * writer. Otherwise, if it is a source, then `set` will be called only
       * by `maybeSet`. */
      LOG("set: " + (vv.writtenBy ? "output" : "source") + " variable " +
        vv + " was not changed");
      return;
    }

    /* You may call `set` with a new value only once during evaluation. If
     * you could call it with a new value more than once, methods would have
     * to be executed multiple times, and we want to avoid that. Identity
     * assignments can be made multiple times. */
    ASSERT(vv.lastChanged !== timestamp,
      "set: do not set " + vv + " more than once");
    vv.lastChanged = timestamp;
    vv.lastUpdated = timestamp + 1;

    /* Notify subscribers later. */
    changedSet.push(vv);

    /* Do not clear usedBy here. Methods will remove themselves before they
     * are executed. In a self-loop, clearing usedBy here will forget
     * a use from the current evaluation. */
    /* However, usedBy will change as we execute each method in it. We need
     * to copy it first, or iteration will be broken. */

    var usedByPrev = vv.usedBy.slice();
    LOG("set: checking methods that used " + vv +
      " during the last evaluation...");
    usedByPrev.forEach(function (mm) {
      ASSERT(mm !== vv.writtenBy,
        "set: do not establish a usedBy link for self-loops");
      if (mm.isSelected) {
        LOG("set: " + mm + " used " + vv + " during the last evaluation");
        /* Small optimization to prevent checking other inputs before
         * execution. */
        mm.needsExecution = true;
        /* Call `maybeExecute` instead of `execute` so that it gets marked as
         * visited. */
        executionQueue.push(mm);
      } else {
        /* The method that replaced this one in the solution will be executed
         * directly by `update`. */
        vv.usedBy.remove(mm);
      }
    });
    LOG("set: finished checking methods that used " + vv +
      " during the last evaluation");
  };

  var isUpdatingFlag = false;

  var update
    = function update(touchedSet, newMethods, executedSetOut, changedSetOut)
  {
    isUpdatingFlag = true;
    LOG("Evaluating...");

    timestamp += 2;
    /* Share the same arrays so that we can use them as output streams. */
    executedSet    = executedSetOut;
    changedSet     = changedSetOut;
    executionQueue = newMethods.slice();

    ASSERT(caller === null,
      "last evaluation phase was interrupted and left in a bad state");

    newMethods.forEach(function (mm) {
      /* Crude name meaning "last time this was a new method." Only used for
       * debugging. Helps us differentiate when we set needsExecution to true:
       * because it is a new method in the solution or because it depends on a
       * changed input. */
      mm.lastNewMethod = timestamp;
      mm.needsExecution = true;
    });

    LOG("Setting source variables in the touchedSet...");
    touchedSet.forEach(function (vv) {
      /* We want to make sure we do not call `set` on a variable multiple
       * times during the same evaluation phase. Ignore a variable that may
       * have been edited after the last update, but is due to be overwritten
       * because of a more recent edit. The variable might also depend on
       * itself, but we took care of that case above. */
      if (!vv.writtenBy) {
        /* Call `maybeSet` instead of `set` here. If two source variables are
         * inputs to the same method, then calling `set` on one input here
         * will cause the method to be executed, which will call `get` ->
         * `maybeSet` -> `set` on the other input. We do not want to call
         * `set` on it again if it comes later in the `touchedSet`. */
        maybeSet(vv);
      }
    });

    LOG("Executing methods...");
    while (executionQueue.length) {
      maybeExecute(executionQueue.pop());
    }

    isUpdatingFlag = false; 
    LOG("Finished evaluation.");
  };

  hd.__private.evaluator = {
    get: function get_(vv) {
      return isUpdatingFlag ? get(vv) : vv.value;
    },
    update: update,
    isUpdating: function isUpdating() {
      return isUpdatingFlag;
    },
    getTimestamp: function getTimestamp() {
      return timestamp;
    }
  };

}());

