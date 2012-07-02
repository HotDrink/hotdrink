(function () {

  var validators = hd.validators;

  hd.binders["date"] = function bindDate(view, options) {
    if (typeof options !== "object")
      options = {value: options};

    if (!options.toModel)
      options.toModel = validators.toDate();
    if (!options.toView)
      options.toView = validators.dateToString();

    hd.binders["textbox"](view, options);
  }

}());

