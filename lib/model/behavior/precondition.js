(function () {

  var factory = hd.__private.factory;

  hd.precondition = function precondition(commands, fn) {
    /* Provide short-cut for single command. */
    if (!Array.isArray(commands)) {
      commands = [commands];
    }
    /* The user has access to proxies, but we want the variables. */
    commands = commands.map(function (proxy) {
      ASSERT(hd.isCommand(proxy),
        "expected precondition to guard command");
      return proxy.unwrap();
    });

    var vv = factory.addComputedVariable("precondition", fn);
    vv.guarded = commands;
  };

  /**
   * @constructs
   * @class
   *   <p>
   *   Preconditions are used to signal when a command should be deactivated.
   *   Model of {@link concept.model.Behavior}.
   *   </p>
   */
  var Precondition = function Precondition() {
  };

  /**
   *   <pre>
   *   /precondition/ :: {
   *     guarded :: [Variable]
   *       The commands guarded by this precondition.
   *   }
   *
   *   /output/ :: {
   *     numPreconFailed :: number
   *       The number of preconditions guarding this command that are in a
   *       failed state.
   *     canBeDisabled :: boolean
   *       Whether the command should be deactivated because its preconditions
   *       have not been met.
   *   }
   *   </pre>
   */
  Precondition.prototype.variable = function variable(vv) {
    if (vv.cellType === "output") {
      vv.numPreconFailed = 0;
      vv.canBeDisabled = false;
    }
  };

  Precondition.prototype.update
    = function update(touchedSet, executedSet, changedSet, timestamp)
  {
    LOG("Examining preconditions...");

    var isFirstUpdate = (this.wasUpdated === undefined);
    this.wasUpdated = true;

    var changedCommands = [];

    changedSet.forEach(function (vv) {
      if (vv.cellType === "precondition") {
        /* Add to the number of failed preconditions if its value is false.
         * Subtract if true, unless this is our first update. */
        var weight = (vv.value ? (this.wasUpdated ? 0 : -1) : 1);
        vv.guarded.forEach(function (ww) {
          ww.numPreconFailed += weight;
          changedCommands.setInsert(ww);
        });
      }
    });

    changedCommands.forEach(function (vv) {
      var canBeDisabledPrev = vv.canBeDisabled;
      vv.canBeDisabled = (vv.numPreconFailed > 0);
      if (vv.canBeDisabled !== canBeDisabledPrev) {
        vv.publish("canBeDisabled", vv.canBeDisabled);
      }
    });

    LOG("Examined preconditions.");
  };

  hd.behaviors.push(new Precondition());

}());

