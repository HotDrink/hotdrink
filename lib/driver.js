(function () {

  /* Default runtime. */
  window.hd = new hotdrink.model.Factory();

  /* Default behaviors. */
  hd.behavior(new hotdrink.model.behavior.Precondition());
  hd.behavior(new hotdrink.model.behavior.Enablement());

}());

