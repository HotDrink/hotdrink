(function () {

  var hdRenderName = "hdRender";

  var writeIf = function write(view, truthy) {
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
  
  var writeIfNot = function writeIfNot(view, truthy) {
    return writeIf(view, !truthy);
  };
  
  var bindIfOrIfNot = function bindIfOrIfNot(view, variable, context, writer) {
    ASSERT(view instanceof jQuery, "expected jQuery object");

    var template = view.contents().detach();

    view.data(hdRenderName, function renderIf() {
      var copy = template.clone();
      hd.bindTree(copy, context);
      return copy;
    });

    hd.bindWrite(variable, view, writer);

    /* Stop recursion. */
    return true;
  }

  hd.binders["if"] = function bindIf(view, variable, context) {
    bindIfOrIfNot(view, variable, context, {write: writeIf});
    return true;
  };
  
  hd.binders["ifnot"] = function bindIfNot(view, variable, context) {
    bindIfOrIfNot(view, variable, context, {write: writeIfNot});
    return true;
  }

}());

