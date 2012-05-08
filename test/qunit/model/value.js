(function () {

  module("value propagation");

  test("hello_world", function () {
    expect(1);

    var model = hottest.hello_world.getModel();
    strictEqual(model.text(), "Hello, World!",
      "[issue 2] constant method gets executed");
  });

  test("full_name", function () {
    expect(2);

    var model = hottest.full_name.getModel();
    strictEqual(model.fullName(), "John Smith",
      "computed variable is initialized");

    model.lastName("Doe");
    hd.update();
    strictEqual(model.fullName(), "John Doe",
      "computed variable is updated");
  });

  test("cycle", function () {
      expect(4);

      var model = hottest.cycle.getModel();
 
      model.bb(1);
      model.cc(1);
      model.aa(1);      
      model.dd(1);

      hd.update();
      strictEqual(model.aa(), "m1",
        "chose to resolve cycle by writing aa");
      strictEqual(model.bb(), "m5",
        "chose the correct method to write bb");
      strictEqual(model.cc(), 1,
        "did not write cc");
      strictEqual(model.dd(), 1,
        "did not write dd");
  });

  test("resize_image", function () {
    expect(11);

    var model = hottest.resize_image.getModel();
    strictEqual(model.initial_width(), 2100,
      "initialized initial_width");
    strictEqual(model.absolute_height(), 1500,
      "initialized absolute_height");
    strictEqual(model.preserve_ratio(), true,
      "initialized preserve_ratio");
    strictEqual(model.relative_width(), 100,
      "initialized relative_width");

    model.relative_width(105);
    hd.update();
    strictEqual(model.relative_height(), 105,
      "calculate relative_height from relative_width");
    strictEqual(model.absolute_height(), 1575,
      "calculate absolute_height from relative_width");

    model.preserve_ratio(false);
    hd.update();
    strictEqual(model.relative_height(), 105,
      "copy old value in self-loop");
    strictEqual(model.relative_height.unwrap().dependsOnSelf, true,
      "correctly marked dependsOnSelf");

    model.relative_height(100);
    model.preserve_ratio(true);
    hd.update();
    strictEqual(model.relative_height(), 100,
      "preservation of more recently edited value");
    strictEqual(model.relative_width(), 100,
      "overwrite less recently edited value");
    strictEqual(model.relative_height.unwrap().dependsOnSelf, false,
      "correctly marked dependsOnSelf");

  });

  test("enforced_minmax", function () {
    expect(6);

    var model = hottest.enforced_minmax.getModel();
    model.min(110);
    hd.update();
    strictEqual(model.value(), 110,
      "min pushes value up");
    strictEqual(model.max(), 110,
      "min pushes max up");

    model.max(90);
    hd.update();
    strictEqual(model.value(), 90,
      "max pushes value down");
    strictEqual(model.min(), 90,
      "max pushes min down");

    model.min(50);
    model.value(40);
    hd.update();
    strictEqual(model.value(), 50,
      "[issue 3] value bounces back above min");

    model.value(100);
    hd.update();
    strictEqual(model.value(), 90,
      "[issue 3] value bounces back below max");
  });

  test("grouped_options", function () {
    expect(5);

    var model = hottest.grouped_options.getModel();
    strictEqual(model.all(), false,
      "initialized all");

    model.all(true);
    hd.update();
    strictEqual(model.a(), true,
      "multi-out method");
    strictEqual(model.b(), true,
      "multi-out method");
    strictEqual(model.c(), true,
      "multi-out method");

    model.b(false);
    hd.update();
    strictEqual(model.all(), false,
      "editing a, b, or c changes all");
  });

}());

