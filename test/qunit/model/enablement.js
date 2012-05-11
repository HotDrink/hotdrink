(function () {

  var getCanBeDisabled = function (model, v) {
    return model[v].unwrap().canBeDisabled;
  };

  module("enablement");

  test("saveImage", function () {
    expect(12);

    var model = new hottest.saveImage.Model();
    strictEqual(model.fileName(), "",
      "fileName initialized");
    strictEqual(model.fileType(), "bmp",
      "fileType initialized");
    strictEqual(getCanBeDisabled(model, "fileName"), false,
      "fileName initially enabled");
    strictEqual(getCanBeDisabled(model, "fileType"), false,
      "fileType initially enabled");
    strictEqual(getCanBeDisabled(model, "compressionRatio"), true,
      "compressionRatio initially disabled");
    strictEqual(getCanBeDisabled(model, "imageQuality"), true,
      "imageQuality initially disabled");
    strictEqual(getCanBeDisabled(model, "result"), true,
      "result initially disabled");

    model.fileType("jpeg");
    hd.update();
    strictEqual(getCanBeDisabled(model, "compressionRatio"), false,
      "compressionRatio enabled");
    strictEqual(getCanBeDisabled(model, "imageQuality"), false,
      "imageQuality enabled");

    model.fileName("name");
    hd.update();
    strictEqual(getCanBeDisabled(model, "result"), false,
      "result enabled");

    model.fileType("bmp");
    hd.update();
    strictEqual(getCanBeDisabled(model, "compressionRatio"), true,
      "compressionRatio disabled");
    strictEqual(getCanBeDisabled(model, "imageQuality"), true,
      "imageQuality disabled");
  });

  test("groupedOptions", function () {
    expect(12);

    var model = new hottest.groupedOptions.Model();
    strictEqual(getCanBeDisabled(model, "all"), false,
      "all initially enabled");
    strictEqual(getCanBeDisabled(model, "a"), false,
      "a initially enabled");
    strictEqual(getCanBeDisabled(model, "b"), false,
      "b initially enabled");
    strictEqual(getCanBeDisabled(model, "c"), false,
      "c initially enabled");

    model.all(true);
    hd.update();
    strictEqual(getCanBeDisabled(model, "all"), false,
      "all still enabled");
    strictEqual(getCanBeDisabled(model, "a"), false,
      "a still enabled");
    strictEqual(getCanBeDisabled(model, "b"), false,
      "b still enabled");
    strictEqual(getCanBeDisabled(model, "c"), false,
      "c still enabled");

    model.b(false);
    hd.update();
    strictEqual(getCanBeDisabled(model, "all"), false,
      "all still enabled");
    strictEqual(getCanBeDisabled(model, "a"), false,
      "a still enabled");
    strictEqual(getCanBeDisabled(model, "b"), false,
      "b still enabled");
    strictEqual(getCanBeDisabled(model, "c"), false,
      "c still enabled");
  });

}());

