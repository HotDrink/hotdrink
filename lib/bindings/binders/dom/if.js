(function () {

  var hdRenderName = "hdRender";

  var write = function write(view, truthy) {
    ASSERT(view instanceof jQuery, "expected jQuery object");

    if (!!truthy) {
      if (view.is(":empty")) {
        var render = view.data(hdRenderName);
        var copy = render();
        view.append(copy);
      }
    } else {
      /* TODO: Unbind. */
      view.empty();
    }
  };

  hd.binders["if"] = function bindIf(view, variable, context) {
    ASSERT(view instanceof jQuery, "expected jQuery object");

    var template = view.contents().detach();

    view.data(hdRenderName, function renderIf() {
      var copy = template.clone();
      hd.bindTree(copy, context);
      return copy;
    });

    hd.bindWrite(variable, view, { write: write });

    /* Stop recursion. */
    return true;
  };

}());

