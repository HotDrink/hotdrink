(function () {

  hd.binders["number"] = function bindNumber(view, options) {
    if (typeof options == "object") {
      var lens = hd.lens(options.value);
      options.value = lens;
    }
    else {
      var lens = hd.lens(options);
      options = lens;
    }

    hd.binders["textbox"](view, options);

    lens.number();
  }

}());

