(function () {

  var hasClass = function hasClass(view, name) {
    var classes = view.attr("class") || "";
    return classes.indexOf(name) >= 0;
  };

  module("binders.css", {
    setup: function () {
      this.view = hottest.elt("<div>");
    }
  });

  test("write constant", function () {
    expect(3);
    ok(!hasClass(this.view, "john"));
    hd.binders["css"](this.view, { john: {} });
    ok(hasClass(this.view, "john"));
    hd.binders["css"](this.view, { john: null });
    ok(!hasClass(this.view, "john"));
  });

  test("bind variable", function () {
    expect(2);
    var truthy = hd.variable(false);
    hd.binders["css"](this.view, { john: truthy });
    truthy(true);
    ok(!hasClass(this.view, "john"));
    hd.update();
    ok(hasClass(this.view, "john"));
  });

}());

