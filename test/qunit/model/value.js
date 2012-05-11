(function () {

  module("value propagation");

  test("helloWorld", function () {
    expect(1);

    var model = new hottest.helloWorld.Model();
    strictEqual(model.text(), "Hello, World!",
      "[issue 2] constant method gets executed");
  });

  test("fullName", function () {
    expect(2);

    var model = new hottest.fullName.Model();
    strictEqual(model.fullName(), "John Smith",
      "computed variable is initialized");

    model.lastName("Doe");
    hd.update();
    strictEqual(model.fullName(), "John Doe",
      "computed variable is updated");
  });

  test("cycle", function () {
      expect(4);

      var model = new hottest.cycle.Model();
 
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

  test("resizeImage", function () {
    expect(11);

    var model = new hottest.resizeImage.Model();
    strictEqual(model.initialWidth(), 2100,
      "initialized initialWidth");
    strictEqual(model.absoluteHeight(), 1500,
      "initialized absoluteHeight");
    strictEqual(model.preserveRatio(), true,
      "initialized preserveRatio");
    strictEqual(model.relativeWidth(), 100,
      "initialized relativeWidth");

    model.relativeWidth(105);
    hd.update();
    strictEqual(model.relativeHeight(), 105,
      "calculate relativeHeight from relativeWidth");
    strictEqual(model.absoluteHeight(), 1575,
      "calculate absoluteHeight from relativeWidth");

    model.preserveRatio(false);
    hd.update();
    strictEqual(model.relativeHeight(), 105,
      "copy old value in self-loop");
    strictEqual(model.relativeHeight.unwrap().dependsOnSelf, true,
      "correctly marked dependsOnSelf");

    model.relativeHeight(100);
    model.preserveRatio(true);
    hd.update();
    strictEqual(model.relativeHeight(), 100,
      "preservation of more recently edited value");
    strictEqual(model.relativeWidth(), 100,
      "overwrite less recently edited value");
    strictEqual(model.relativeHeight.unwrap().dependsOnSelf, false,
      "correctly marked dependsOnSelf");

  });

  test("enforcedMinmax", function () {
    expect(6);

    var model = new hottest.enforcedMinmax.Model();
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

  test("groupedOptions", function () {
    expect(5);

    var model = new hottest.groupedOptions.Model();
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

