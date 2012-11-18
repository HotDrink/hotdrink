(function () {

  module("binders.visible", {
    setup: function () {
      this.view = $("<div>").hide().appendTo("#qunit-fixture");
    }
  });

  test("write constant", function () {
    expect(2);
    hd.binders["visible"](this.view, null);
    strictEqual(this.view.css("display"), "none");
    hd.binders["visible"](this.view, {});
    notStrictEqual(this.view.css("display"), "none");
  });

  test("bind variable", function () {
    expect(2);
    var truthy = hd.variable(true);
    hd.binders["visible"](this.view, truthy);
    truthy(false);
    notStrictEqual(this.view.css("display"), "none");
    hd.update();
    strictEqual(this.view.css("display"), "none");
  });

  module("binders.invisible", {
    setup: function () {
      this.view = $("<div>").hide().appendTo("#qunit-fixture");
    }
  });

  test("write constant", function () {
    expect(2);
    hd.binders["invisible"](this.view, null);
    notStrictEqual(this.view.css("display"), "none");
    hd.binders["invisible"](this.view, {});
    strictEqual(this.view.css("display"), "none");
  });

  test("bind variable", function () {
    expect(1);
    var truthy = hd.variable(false);
    hd.binders["invisible"](this.view, truthy);
    truthy(true);
    hd.update();
    strictEqual(this.view.css("display"), "none");
  });

}());

