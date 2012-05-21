(function () {

  hd.binders["event"] = function bindEvent(view, events, context) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    Object.keys(events).forEach(function (evtName) {
      var fn = events[evtName];
      ASSERT(typeof fn === "function",
        "expected command or function, got " + typeof fn);

      /* Assume functions should be executed in context. For convenience, the
       * first parameter passed is $this. */
      view.on(evtName, function eventHandler(evt) {
        fn.call(context, context["$this"]);
        /* Prevent default and stop propagation. */
        return false;
      });
    });
  };

}());

