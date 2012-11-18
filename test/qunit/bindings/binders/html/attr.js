(function () {

  module("binders.attr", {
    setup: function () {
      this.view = $("<div>").hide().appendTo("#qunit-fixture");
    }
  });

  test("write constant", function () {
    expect(2);
    strictEqual(this.view.attr("id"), undefined);
    hd.binders["attr"](this.view, { id: "john" });
    strictEqual(this.view.attr("id"), "john");
  });

  test("bind variable", function () {
    expect(2);
    var id = hd.variable("john");
    hd.binders["attr"](this.view, { id: id });
    id("jaakko");
    strictEqual(this.view.attr("id"), "john");
    hd.update();
    strictEqual(this.view.attr("id"), "jaakko");
  });

}());

