(function () {

  var getCanBeDisabled = function (model, v) {
    return model[v].getMore().canBeDisabled;
  };

  module("enablement");

  test("save_image", function () {
    expect(12);

    var model = hottest.save_image.getModel();
    strictEqual(model.file_name(), "",
      "file_name initialized");
    strictEqual(model.file_type(), "bmp",
      "file_type initialized");
    strictEqual(getCanBeDisabled(model, "file_name"), false,
      "file_name initially enabled");
    strictEqual(getCanBeDisabled(model, "file_type"), false,
      "file_type initially enabled");
    strictEqual(getCanBeDisabled(model, "compression_ratio"), true,
      "compression_ratio initially disabled");
    strictEqual(getCanBeDisabled(model, "image_quality"), true,
      "image_quality initially disabled");
    strictEqual(getCanBeDisabled(model, "result"), true,
      "result initially disabled");

    model.file_type("jpeg");
    hd.update();
    strictEqual(getCanBeDisabled(model, "compression_ratio"), false,
      "compression_ratio enabled");
    strictEqual(getCanBeDisabled(model, "image_quality"), false,
      "image_quality enabled");

    model.file_name("name");
    hd.update();
    strictEqual(getCanBeDisabled(model, "result"), false,
      "result enabled");

    model.file_type("bmp");
    hd.update();
    strictEqual(getCanBeDisabled(model, "compression_ratio"), true,
      "compression_ratio disabled");
    strictEqual(getCanBeDisabled(model, "image_quality"), true,
      "image_quality disabled");
  });

  test("grouped_options", function () {
    expect(12);

    var model = hottest.grouped_options.getModel();
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

