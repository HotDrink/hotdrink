(function () {

  var validators = hd.validators;

  hd.binders["date"] = function bindDate(view, options) {
    if (typeof options !== "object") {
      options = { value: options };
    }

    if (!options.toModel) {
      options.toModel = hd.util.toDate();
    }
    if (!options.toView) {
      options.toView = hd.util.dateToString();
    }

    hd.binders["btb"](view, options);
  }

}());

