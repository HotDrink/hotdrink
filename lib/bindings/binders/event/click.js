(function () {

  hd.binders["click"] = function bindClick(view, fn, context) {
    hd.binders["event"](view, { "click": fn }, context);
    if (hd.isCommand(fn)) hd.bindEnablement(fn, view);
  };

}());

