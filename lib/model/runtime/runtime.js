/**
 * @fileOverview <p>{@link hotdrink.model.Runtime}</p>
 * @author John Freeman
 */

//provides("hotdrink.model.Runtime");

(function () {

  var Runtime = function Runtime() {
    /**
     *   List of variables that have been touched since the last call to
     *   update. A touch marks a change whether the value is different or not,
     *   and it is used to signal a desire to change the dataflow and notify
     *   observers. The user can set multiple variables before updating, so we
     *   need to keep track of all changes.
     *
     *   For the first call to update, this should contain the names of all
     *   variables. Add them when they are constructed.
     */
    this.touchedSet = [];

    this.evaluator = new hotdrink.model.graph.Evaluator();
    this.updateTask = null;

    this.behaviors = [];
  };

  /*****************************/
  /* Touch, set, get. */

  Runtime.prototype.touch = function touch(vv) {
    LOG("touched " + vv);
    if (!contains(this.touchedSet, vv)) this.touchedSet.push(vv);

    if (vv.solver) {
      vv.solver.promote(vv);
      LOG("promoted " + vv);
    }

    this.updateLater();
  };

  Runtime.prototype.set = function set(vv, value) {
    ASSERT(!this.isUpdating(),
      "do not set variables from within methods");
    LOG("edited " + vv + ": " + JSON.stringify(value));
    /* Setting a variable with its current value should still touch it. We
     * will check for identity assignments later. Multiple assignments to the
     * same variable are reduced to one (the latest) so that we do not call
     * set() more than once. */
    vv.set(value);
    this.touch(vv);
  };

  Runtime.prototype.getVariable = function getVariable(vv) {
    if (this.isUpdating()) {
      return this.evaluator.get(vv);
    } else {
      return vv.value;
    }
  };

  Runtime.prototype.getCommand = function getCommand(vv, ctx, args) {
    ASSERT(!this.isUpdating(),
      "do not call commands from within methods");
    /* Don't just return the stored command, call it for the user. */
    return vv.value.apply(ctx, args);
  };

  /*****************************/
  /* Behaviors. */

  /* behavior.update
   *   :: function (touchedSet, newMethods, changedSet, timestamp) */
  Runtime.prototype.subscribe = function subscribe(behavior) {
    this.behaviors.push(behavior);
  };

  /*****************************/
  /* Update. */

  Runtime.prototype.updateLater = function updateLater() {
    if (!this.updateTask) {
      this.updateTask = setTimeout(this.update.bind(this), 0);
    }
  };

  Runtime.prototype.update = function update() {
    /* Skip if we can. */
    if (this.touchedSet.length === 0) {
      return;
    }

    /* Flush the update. */
    ASSERT(this.updateTask,
      "expected an update to be scheduled after touching");
    clearTimeout(this.updateTask);
    this.updateTask = null;

    LOG("Updating...");

    var newMethods = [];
    this.touchedSet.forEach(function (vv) {
      LOG(vv + " is " + ((vv.solver) ? ("") : ("not ")) +
          "attached to multi-way constraints");
      if (vv.solver) Array.prototype.push.apply(newMethods, vv.solver.solve());
    });

    /* TODO: is there a better name? */
    //var droppedInputs = [];
    //newMethods.forEach(function (mm) {
      /* Newly unselected methods are no longer using ANY of their inputs. We
       * will find during evaluation which selected methods are no longer using
       * at least one of their inputs. */
      //var cc = mm.constraint;
      //assert(mm.isSelected && (mm === cc.selectedMethod)
             //&& (mm !== cc.selectedMethodPrev),
        //"expected method to be new in the solution");
      //var mmUnselected = mm.constraint.selectedMethodPrev;
      //if (mmUnselected) {
        //mmUnselected.inputsUsedPrev = mmUnselected.inputsUsed;
        //mmUnselected.inputsUsed = [];
        //droppedInputs.push(mmUnselected);
      //}
    //});

    this.touchedSet.forEach(function (vv) {
      /* We do not want to call a self-dependent variable's writer by setting
       * the variable - it will lead to a second call to set(). Instead,
       * pretend its writer is a new method (if it is still in the solution). */
      /* A computed variable needs its writer executed at least once during an
       * evaluation phase to establish a usedBy connection with its inputs. We
       * lie when we create it, saying that it dependsOnSelf, just so that it
       * gets computed here. */
      if (vv.dependsOnSelf && vv.writtenBy) {
        newMethods.push(vv.writtenBy);
      }
    });

    var executedSet = [];
    var changedSet = [];
    this.evaluator.update(
      this.touchedSet, newMethods, executedSet, changedSet);

    LOG("touchedSet = " + this.touchedSet);
    LOG("newMethods = " + newMethods);
    LOG("executedSet = " + executedSet);
    LOG("changedSet = " + changedSet);

    /* Now that we have all three descriptions of incremental changes, pass them
     * to our behaviors. */
    this.behaviors.forEach(function (behavior) {
      behavior.update(this.touchedSet, executedSet, changedSet,
        this.evaluator.getTimestamp());
    }, this);

    this.touchedSet = [];
    LOG("Finished update.");
  };

  Runtime.prototype.isUpdating = function isUpdating() {
    return this.evaluator.isUpdating();
  }

  /*****************************/
  /* Exports. */

  var runtime = new Runtime();

  namespace.open("hotdrink.model").Runtime = Runtime;

}());

