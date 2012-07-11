(function () {

  hd.binders["number"] = function bindNumber(view, options) {
    if (typeof options !== "object")
      options = {value: options};

    if (!options.toModel)
      options.toModel = hd.util.toNum();
    if (!options.toView)
      options.toView = hd.util.toString();

    hd.binders["textbox"](view, options);
  }

}());

