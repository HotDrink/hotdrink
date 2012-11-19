(function () {

  module("binders.attr", {
    setup: function () {
      this.view = hottest.elt("<div>");
    }
  });

  test("write constant", function () {
    expect(2);
    notStrictEqual(this.view.attr("id"), "john");
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

