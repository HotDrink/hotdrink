(function () {

  hd.binders["submit"] = function bindSubmit(view, fn, context) {
    hd.binders["event"](view, { "submit": fn }, context);
  };

}());

