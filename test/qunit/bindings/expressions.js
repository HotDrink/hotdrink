(function () {

  module("binding expressions", {
    setup: function () {
      this.view = hottest.elt("<div>");
    }
  });

  test("no expression", function () {
    expect(2);
    this.view.attr("data-bind", "text: name");
    notStrictEqual(this.view.text(), "john");
    hd.bind({ name: "john" }, this.view);
    strictEqual(this.view.text(), "john");
  });

  test("constant expression", function () {
    expect(1);
    this.view.attr("data-bind", "text: `name`");
    hd.bind({ name: "john" }, this.view);
    /* Weird bug where this actually calls strictEqual or something. */
    //notStrictEqual(this.view.text(), "john");
    hd.update();
    strictEqual(this.view.text(), "john");
  });

  test("string concatenation", function () {
    expect(1);
    this.view.attr("data-bind", "text: `'id_' + name`");
    hd.bind({ name: "john" }, this.view);
    //notStrictEqual(this.view.text(), "id_john");
    hd.update();
    strictEqual(this.view.text(), "id_john");
  });

  test("variable expression", function () {
    expect(3);
    this.view.attr("data-bind", "attr: { id: `name()` }");
    var name = hd.variable("john");
    hd.bind({ name: name }, this.view);
    //notStrictEqual(this.view.attr("id"), "john");
    hd.update();
    strictEqual(this.view.attr("id"), "john");
    name("jaakko");
    strictEqual(this.view.attr("id"), "john");
    hd.update();
    strictEqual(this.view.attr("id"), "jaakko");
  });

}());
 
