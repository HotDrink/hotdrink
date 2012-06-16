(function () {

  /**
   * @constructs
   * @class
   *   <p>
   *   Tracks blame and poison in order to (de)activate commands. Model of
   *   {@link concept.model.Behavior}.
   *   </p>
   */
  var Activation = function Activiation() {
    /* Every output must be checked after evaluation - the incremental change
     * information is not enough. An invariant can change satisfaction or
     * relevance without an output changing value, so to (de)activate outputs in
     * these circumstances, we just have to check them all. */
    this.outputs = [];
  };

  /**
   *   <pre>
   *   /variable/ :: {
   *     blamedBy :: number,
   *       The number of invariants blaming this variable. If positive, then the
   *       variable should poison.
   *     lastPoisoned :: timestamp,
   *     isPoisoned :: boolean,
   *       Whether a variable used a value contributing to a failed invariant.
   *       Poisoned outputs should be deactivated.
   *   }
   *
   *   /output/ :: {
   *     canBeDisabled :: boolean
   *       The analysis result.
   *   }
   *   </pre>
   */
  Activation.prototype.variable = function variable(vv) {
    if (vv.cellType === "output") {
      ASSERT(!this.outputs.has(vv),
        "variables should be constructed only once");
      LOG("found an output");
      this.outputs.push(vv);
      vv.canBeDisabled = false;
    }

    /* Assume that all invariants start off satisfied. We will be notified of
     * changes. */
    if (vv.cellType === "invariant") {
      vv.value = true;
    }

    vv.blamedBy = 0;
    /* isPoisoned and lastPoisoned don't need initialization because they are
     * timestamp-based. */
  };

  /**
   * @see concept.model.Behavior#update
   */
  Activation.prototype.update
    = function update(touchedSet, newMethods, droppedInputs, changedSet,
                      timestamp)
  {
    LOG("Starting analysis for activation behavior...");

    var isFirstUpdate = (this.timestamp === undefined)
    this.timestamp = timestamp;

    /* We don't need to check outputs if no invariants changed. */
    var invChanged = false;

    changedSet.forEach(function (vv) {
      if (vv.cellType === "invariant") {
        invChanged = true;
        /* Do not forgive variables on the first update. Always blame when the
         * invariant is false. */
        var increment = (vv.value ? (isFirstUpdate ? 0 : -1) : 1);
        this.blame(vv, increment);
      }
    }, this);

    if (invChanged) {
      this.outputs.forEach(function (vv) {
        LOG("checking " + vv + " for poison...");
        var canBeDisabledPrev = vv.canBeDisabled;
        vv.canBeDisabled = this.isPoisoned(vv);
        LOG(vv + " can " + ((vv.canBeDisabled) ? ("") : ("not ")) +
            "be deactivated");
        if (vv.canBeDisabled !== canBeDisabledPrev) {
          vv.publish("canBeDisabled", vv);
        }
      }, this);
    }

    LOG("Finished analysis for activation behavior.");
  };

  /**
   * Blame or forgive the variable and each variable that was definitely used to
   * determine its value.
   * @name blame
   * @function
   * @inner
   * @param {Variable} variable
   * @param {Number} increment
   *   This is an integer to add to the blamedBy field. If it is +1, we
   *   are blaming; if -1, forgiving.    */
  Activation.prototype.blame = function blame(vv, increment) {
    /* If this variable has already been visited, then we can go home early. */
    //if (vv.lastBlamed === this.timestamp) return;
    //vv.lastBlamed = this.timestamp;

    /* Blame or forgive this variable. */
    vv.blamedBy += increment;
    LOG(((increment > 0) ? "blamed " : "forgave ") + vv);
    LOG(vv + " now blamed by " + vv.blamedBy);

    /* If a method wrote this variable, then blame each of its used inputs.
     * Otherwise, spread poison. */
    var mm = vv.writtenBy;
    if (mm) {
      mm.inputsUsed.forEach(function (uu) {
        this.blame(uu, increment);
      }, this);
    }
  };

  /**
   * Search the ancestors of this variable for a blamed variable. If we find
   * one, then we're poisoned.
   * @name isPoisoned
   * @function
   * @inner
   * @param {Model} model
   * @param {String} variable
   */
  Activation.prototype.isPoisoned = function isPoisoned(vv) {
    /* If this variable has already been checked, then we can go home early. */
    if (vv.lastPoisoned === this.timestamp) return vv.isPoisoned;
    vv.lastPoisoned = this.timestamp;

    /* Base case: a blamed variable is poisoned. */
    if (vv.blamedBy > 0) {
      LOG(vv + " is a source of poison");
      return vv.isPoisoned = true;
    }

    /* Recursion: a variable can be poisoned by its ancestors. */
    var mm = vv.writtenBy;
    if (mm) {
      return vv.isPoisoned = mm.inputsUsed.some(function (uu) {
        var found = this.isPoisoned(uu);
        if (found) LOG(vv + " was poisoned by " + uu);
        return found;
      }, this);
    }

    /* If we got this far, then it must be healthy. */
    return false;
  };

  //hd.behavior(new Activation);

}());

