(function () {

  var proxies = hd.__private.proxies;

  var push = function push() {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    vv.changeEvent = { add: [vv.value.length, arguments.length] };
    Array.prototype.push.apply(vv.value, arguments);

    runtime.touch(vv);
  };

  /* TODO: Multi-item remove() requires changeEvent support. */
  var remove = function remove(item) {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    /* Abort when no change. */
    var index = vv.value.indexOf(item);
    if (index < 0) return;
    vv.changeEvent = { remove: [index, 1] };
    vv.value.splice(index, 1);

    runtime.touch(vv);
  };

  var pop = function pop() {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    /* Abort when no change. */
    if (vv.value.length === 0) return;
    vv.changeEvent = { remove: [vv.value.length - 1, 1] };
    vv.value.pop();

    runtime.touch(vv);
  };

  //var filter = function filter() {
  //};

  proxies.makeArrayProxy = function makeArrayProxy(vv) {
    ASSERT(vv.cellType = "interface",
      "cannot make array proxy for " + vv);
    ASSERT(Array.isArray(vv.value),
      "array proxies are for array values only");

    var proxy = function hdArrayProxy(a0, a1) {
      if (arguments.length === 1) {
        /* Array assignment: proxy(other) */
        vv.set(a0);
      } else if (arguments.length === 2) {
        /* Element assignment: proxy(index, elt) */
        vv.value[a0] = a1;
        vv.changeEvent = { remove: [a0, 1], add: [a0, 1] };
        runtime.touch(vv);
      } else {
        return evaluator.get(vv);
      }
    };

    proxy.push   = push;
    proxy.pop    = pop;
    proxy.remove = remove;

    return proxies.finishProxy(vv, proxy);
  };

  hd.isArray = function isArray(proxy) {
    return hd.isProxy(proxy) && Array.isArray(proxy.unwrap().value);
  };

}());

