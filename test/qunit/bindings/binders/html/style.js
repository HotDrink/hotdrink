(function () {

  module("binders.style", {
    setup: function () {
      this.view = hottest.elt("<div>");
    }
  });

  test("write constant", function () {
    expect(2);
    notStrictEqual(this.view.css("color"), "rgb(128, 0, 0)");
    hd.binders["style"](this.view, { color: "maroon" });
    strictEqual(this.view.css("color"), "rgb(128, 0, 0)");
  });

  test("bind variable", function () {
    expect(2);
    var color = hd.variable("maroon");
    hd.binders["style"](this.view, { color: color });
    color("white");
    strictEqual(this.view.css("color"), "rgb(128, 0, 0)");
    hd.update();
    strictEqual(this.view.css("color"), "rgb(255, 255, 255)");
  });

}());

