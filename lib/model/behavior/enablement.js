/**
 * @fileOverview <p>{@link hotdrink.model.behavior.Enablement}</p>
 * @author John Freeman
 */

//provides("hotdrink.model.behavior.Enablement");

(function () {

  /**
   * @constructs
   * @class
   *   <p>
   *   Tracks relevance in order to disable/enable widgets. Model of
   *   {@link concept.model.Behavior}.
   *   </p>
   */
  var Enablement = function Enablement() {
  };

  /**
   *   <pre>
   *   /variable/ :: {
   *     isRelevant :: boolean,
   *     canBeRelevant :: boolean
   *   }
   *
   *   /interface/ :: {
   *     canBeDisabled :: boolean
   *       The analysis result.
   *   }
   *   </pre>
   */
  Enablement.prototype.variable = function variable(vv) {
    if (vv.cellType === "interface") {
      vv.canBeDisabled = false;
    }
  };

  /**
   * @see concept.model.Behavior#update
   */
  Enablement.prototype.update
    = function update(touchedSet, executedSet, changedSet, timestamp)
  {
    this.timestamp = timestamp;

    LOG("Starting enablement analysis...");

    executedSet.forEach(function (mm) {
      /* Only need to check the mutual difference, but not sure calculating that
       * worth the effort. */
      mm.inputsUsedPrev.forEach(this.maybeMarkCanBeDisabled.bind(this));
      mm.inputsUsed.forEach(this.maybeMarkCanBeDisabled.bind(this));
    }, this);

    LOG("Finished enablement analysis.");
  };

  Enablement.prototype.maybeMarkCanBeDisabled
    = function maybeMarkCanBeDisabled(vv)
  {
    /* If this variable has already been checked, then we can go home early. */
    if (vv.lastCanBeDisabled === this.timestamp) return;
    vv.lastCanBeDisabled = this.timestamp;

    /* Only interface variables can be disabled. */
    if (vv.cellType !== "interface") return;

    var canBeDisabledPrev = vv.canBeDisabled;
    /* TODO: Should we enable if it is violating a precondition? */
    vv.canBeDisabled = (!this.canBeRelevant(vv));
    LOG(vv + " can " + (vv.canBeDisabled ? "" : "not ") + "be disabled");
    if (vv.canBeDisabled !== canBeDisabledPrev) {
      vv.publish("canBeDisabled", vv.canBeDisabled);
      
      /* If I changed, then my neighbors might as well. */
      var vvv = vv.inner;
      if (vvv) {
        vvv.constraints.forEach(function (ccc) {
          ccc.variables.forEach(function (vvvPeer) {
            this.maybeMarkCanBeDisabled(vvvPeer.outer);
          }, this);
        }, this);
      }
    }
  };

  /**
   */
  Enablement.prototype.canBeRelevant = function canBeRelevant(vv) {
    LOG("can " + vv + " be relevant?");

    /* If this variable has already been checked, then we can go home early. */
    if (vv.lastCanBeRelevant === this.timestamp) {
      LOG((vv.canBeRelevant ? "yes" : "no"));
      return vv.canBeRelevant;
    }
    vv.lastCanBeRelevant = this.timestamp;

    /* Base case: relevant variables can be relevant. */
    if (this.isRelevant(vv)) {
      LOG(vv + " can be relevant");
      return vv.canBeRelevant = true;
    }

    /* Recursion: if I am relevant, or after being touched, I can change the
     * solution graph to become relevant, then I can be relevant. */
    var mm = vv.writtenBy;
    /* If I am not written, or written by a one-way constraint, then touching
     * me will not change the solution. */
    if (!(mm && mm.constraint)) {
      LOG(vv + " cannot be relevant");
      return vv.canBeRelevant = false;
    }

    LOG("finding ways to be relevant by changing the constraint writing it...");
    var mmPeers = mm.constraint.methods;
    vv.canBeRelevant = mmPeers.some(function (nn) {
      /* Only methods that do not write to us could be selected after we are
       * touched. */
      if (contains(nn.outputs, vv)) return false;

      /* Otherwise, if it has outputs that can be relevant, then we can be
       * relevant too. */
      return nn.outputs.some(function (ww) {
        return this.canBeRelevant(ww);
      }, this);
    }, this);

    LOG(vv + " can" + (vv.canBeRelevant ? "" : "not") + " be relevant");
    return vv.canBeRelevant;
  };

  /**
   * Any variable that can reach an output in the current solution is relevant.
   */
  Enablement.prototype.isRelevant = function isRelevant(vv) {
    LOG("is " + vv + " relevant now?");

    /* If this variable has already been checked, then we can go home early. */
    if (vv.lastIsRelevant === this.timestamp) {
      LOG((vv.isRelevant ? "yes" : "no" ));
      return vv.isRelevant;
    }
    vv.lastIsRelevant = this.timestamp;

    /* Base case: outputs are relevant. */
    if (vv.cellType === "output") {
      LOG(vv + " is relevant");
      return vv.isRelevant = true;
    }

    /* Recursion: if I reach a relevant variable in the current evaluation
     * graph, then I am relevant. */
    vv.isRelevant = vv.usedBy.some(function (mm) {
      return mm.outputs.some(function (ww) {
        return this.isRelevant(ww);
      }, this);
    }, this);

    LOG(vv + " is" + (vv.isRelevant ? "" : " not") + " relevant");
    return vv.isRelevant;
  };

  namespace.open("hotdrink.model.behavior").Enablement = Enablement;

}());

