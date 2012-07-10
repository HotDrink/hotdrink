(function () {

  var hdRenderName = "hdRender";
  var hdMirrorName = "hdMirror";

  var clear = function clear(view) {
    view.empty();
    var stub = $(document.createTextNode("")).appendTo(view);
    view.data(hdMirrorName, [stub]);
  };

  var add = function add(view, list, index, howMany) {
    var render = view.data(hdRenderName);
    /* `hdMirror` is a JavaScript array mirroring `list`, but with an extra
     * placeholder at the end.
     *  - Each element in the array is a jQuery object. 
     *  - The last element is an empty-string text node. It provides an
     *    insertion point for $.before.
     *  - Every other element is a clone of `template` bound to the
     *    corresponding element in `list`.
     *  - Corresponding elements in `hdMirror` and `list` have the same
     *    index. 
     */
    var mirror = view.data(hdMirrorName);
    var slot = mirror[index];
    var copies = [];

    for (var i = 0; i < howMany; ++i) {
      var copy = render(list[index + i]);
      copies[i] = copy;
      slot.first().before(copy);
    }

    copies.unshift(index, 0);
    Array.prototype.splice.apply(mirror, copies);
  };

  var remove = function remove(view, index, howMany) {
    var mirror = view.data(hdMirrorName);
    mirror.splice(index, howMany).forEach(function (deadCopy) {
      deadCopy.remove();
    });
  };

  var set = function set(view, list) {
    clear(view);
    add(view, list, 0, list.length);
  };

  var write = function writeForEach(view, list, changeEvent) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(Array.isArray(list), "expected array");

    if (changeEvent.set) {
      set(view, list);
      return;
    }

    /* Order is important here. */
    if (changeEvent.removes) {
      changeEvent.removes.forEach(function (args) {
        remove(view, args.index, args.howMany);
      });
    }

    if (changeEvent.adds) {
      changeEvent.adds.forEach(function (args) {
        add(view, list, args.index, args.howMany);
      });
    }
  };

  hd.binders["foreach"] = function bindForEach(view, variable, context) {
    ASSERT(view instanceof jQuery, "expected jQuery object");

    var template = view.contents().detach();

    view.data(hdRenderName, function renderForEach(value) {
      var copy = template.clone();
      hd.subbind(copy, value, context);
      return copy;
    });
    clear(view);

    hd.bindWrite(variable, view, { write: write });

    /* Stop recursion. */
    return true;
  };

}());

