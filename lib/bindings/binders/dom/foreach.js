(function () {

  var hdRenderName = "hdRender";
  var hdMirrorName = "hdMirror";

  var clear = function clear(view) {
    view.empty();
    var stub = $(document.createTextNode("")).appendTo(view);
    view.data(hdMirrorName, [stub]);
  };

  var add = function add(view, index, items) {
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
    var i;

    for (i = 0; i < items.length; ++i) {
      var copy = render(items[i]);
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
    add(view, 0, list);
  };

  var swap = function swap(view, i, j) {
    var mirror = view.data(hdMirrorName);
    var ie = mirror[i], je = mirror[j];
    /* The order of this manipulation matters. Remember i comes before j. */
    ie.detach();
    je.detach();
    mirror[j + 1].first().before(ie);
    mirror[j] = ie;
    mirror[i + 1].first().before(je);
    mirror[i] = je;
  };

  var write = function writeForEach(view, list, changes) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    ASSERT(Array.isArray(list), "expected array");

    /* Use `some` so that we can break iteration by returning `true`, which
     * indicates we saw all the changes we care about, i.e. we encountered a
     * fully destructive change. */
    changes.some(function (change) {
      if (change.set) {
        set(view, list);
        return true;
      } else if (change.remove) {
        remove(view, change.remove.index, change.remove.howMany);
      } else if (change.add) {
        add(view, change.add.index, change.add.items);
      } else if (change.swap) {
        swap(view, change.swap[0], change.swap[1]);
      }
    });
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

