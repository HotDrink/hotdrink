(function () {

  module("binders.text", {
    setup: function () {
      this.view = $("<p>").hide().appendTo("#qunit-fixture");
    }
  });

  test("write constant string", function () {
    expect(2);
    strictEqual(this.view.text(), "");
    hd.binders["text"](this.view, "john");
    strictEqual(this.view.text(), "john");
  });

  test("write html", function () {
    expect(1);
    hd.binders["text"](this.view, "<p>john</p>");
    strictEqual(this.view.text(), "<p>john</p>");
  });

  test("write constant object", function () {
    expect(3);
    strictEqual(this.view.text(), "");
    hd.binders["text"](this.view, null);
    strictEqual(this.view.text(), "null");
    var obj = { red: "fish", blue: "fish" };
    hd.binders["text"](this.view, obj);
    strictEqual(this.view.text(), JSON.stringify(obj));
  });

  test("bind variable", function () {
    expect(2);
    var text = hd.variable("john");
    hd.binders["text"](this.view, text);
    text("jaakko");
    strictEqual(this.view.text(), "john");
    hd.update();
    strictEqual(this.view.text(), "jaakko");
  });

}());

