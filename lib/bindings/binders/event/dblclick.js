(function () {

  hd.binders["dblclick"] = function bindDblClick(view, fn, context) {
    hd.binders["event"](view, { "dblclick": fn }, context);
  };

}());

