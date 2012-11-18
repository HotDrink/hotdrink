(function () {

  module("binders.html", {
    setup: function () {
      this.view = $("<div>").hide().appendTo("#qunit-fixture");
    }
  });

  test("write constant", function () {
    expect(4);
    strictEqual(this.view.text(), "");
    strictEqual(this.view.html(), "");
    hd.binders["html"](this.view, "<p>john</p>");
    strictEqual(this.view.text(), "john");
    strictEqual(this.view.html(), "<p>john</p>");
  });

  test("bind variable", function () {
    expect(4);
    var html = hd.variable("<p>john</p>");
    hd.binders["html"](this.view, html);
    html("<p>jaakko</p>");
    strictEqual(this.view.text(), "john");
    strictEqual(this.view.html(), "<p>john</p>");
    hd.update();
    strictEqual(this.view.text(), "jaakko");
    strictEqual(this.view.html(), "<p>jaakko</p>");
  });

}());

