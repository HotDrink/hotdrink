(function () {

  var factory = hd.__private.factory;

  /* Preconditions are used to signal when a command should be
   * deactivated. */
  var preconditionBehavior = {
    isFirstUpdate: true
  };

  hd.behaviors.push(preconditionBehavior);

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
    /* The commands guarded by this precondition. */
    vv.guarded = commands;

    /* Initialize newly guarded commands. */
    commands.forEach(function (ww) {
      if (ww.hasOwnProperty("canBeDisabled")) {
        return;
      }

      /* The number of preconditions guarding this command that are in a
       * failed state. */
      ww.numPreconFailed = 0;
      /* Whether the command should be deactivated because its preconditions
       * have not been met. */
      ww.canBeDisabled   = false;
    });
  };

  preconditionBehavior.update
    = function update(touchedSet, executedSet, changedSet, timestamp)
  {
    LOG("Examining preconditions...");

    var changedCommands = [];

    changedSet.forEach(function (vv) {
      if (vv.cellType !== "precondition") {
        return;
      }

      /* Add to the number of failed preconditions if its value is false.
       * Subtract if true, unless this is our first update. */
      var weight = (vv.value ? (this.isFirstUpdate ? 0 : -1) : 1);
      vv.guarded.forEach(function (ww) {
        ww.numPreconFailed += weight;
        changedCommands.setInsert(ww);
      });
    }, this);

    this.isFirstUpdate = false;

    changedCommands.forEach(function (vv) {
      var canBeDisabledPrev = vv.canBeDisabled;
      vv.canBeDisabled = (vv.numPreconFailed > 0);
      if (vv.canBeDisabled !== canBeDisabledPrev) {
        vv.draft("canBeDisabled", vv.canBeDisabled);
      }
    });

    LOG("Examined preconditions.");
  };

}());

