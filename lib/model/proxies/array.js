(function () {

  var proxies   = hd.__private.proxies;
  var runtime   = hd.__private.runtime;
  var evaluator = hd.__private.evaluator;

  var clear = function clear() {
    var vv = this.unwrap();

    vv.draft("value", { set: true });

    runtime.touch(vv);
    
    vv.value = [];
    return this;
  };
  
  var pop = function pop() {
    var vv = this.unwrap();

    /* Abort when no change. */
    if (vv.value.length === 0) {
      return;
    }

    /* If there is a `set` change, subscribers should ignore everything
     * following. That way, we don't have to check here. This goes for every
     * change. */
    vv.draft("value").push({
      remove: { index: vv.value.length - 1, howMany: 1 }
    });

    runtime.touch(vv);

    return vv.value.pop();
  };
  
  var push = function push() {
    var vv = this.unwrap();

    vv.draft("value").push({
      add: {
        index: vv.value.length,
        items: Array.prototype.slice.call(arguments)
      }
    });

    runtime.touch(vv);

    return Array.prototype.push.apply(vv.value, arguments);
  };
  
  var reverse = function reverse() {
    var vv = this.unwrap();

    vv.draft("value", { set: true });

    runtime.touch(vv);
    
    vv.value.reverse();
    return this;
  };

  var shift = function shift() {
    var vv = this.unwrap();

    /* Abort when no change. */
    if (vv.value.length === 0) {
      return;
    }
    vv.draft("value").push({
      remove: { index: 0, howMany: 1 }
    });

    runtime.touch(vv);

    return vv.value.shift();
  };
  
  var sort = function sort(f) {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    vv.draft("value", { set: true });

    runtime.touch(vv);
    
    vv.value.sort(f);
    return this;
  };

  var splice = function splice(index, howMany/*, ...*/) {
    var vv = this.unwrap();
    var list = vv.value;

    if (index < 0) {
      index = ((list.length + index) >= 0) ? (list.length + index) : 0;
    }

    if ((arguments.length === 1) || (howMany > list.length - index)) {
      howMany = list.length - index;
    }

    if (howMany > 0) {
      vv.draft("value").push({
        remove: { index: index, howMany: howMany }
      });
    }

    if (arguments.length > 2) {
      vv.draft("value").push({
        add: {
          index: index,
          items: Array.prototype.slice.call(arguments, 2)
        }
      });
    }

    runtime.touch(vv);

    return Array.prototype.splice.apply(vv.value, arguments);
  };

  var unshift = function unshift() {
    var vv = this.unwrap();

    vv.draft("value").push({
      add: {
        index: 0,
        items: Array.prototype.slice.call(arguments)
      }
    });

    runtime.touch(vv);

    return Array.prototype.unshift.apply(vv.value, arguments);
  };

  /* Instead of burdening each consumer with the task of sorting the
   * removals, we guarantee that removes are in back-to-front order. */
  var subranges = function subranges(list, pred, f) {
    var howMany = 0;
    var i = list.length;
    for (; i > 0; --i) {
      if (pred(list[i - 1])) {
        ++howMany;
      } else if (howMany > 0) {
        f(i, howMany);
        howMany = 0;
      }
    }

    if (howMany > 0) {
      f(i, howMany);
    }
  };

  var prune = function prune(pred) {
    var vv = this.unwrap();

    var list  = vv.value;
    var draft = vv.draft("value");
    subranges(list, pred, function (index, howMany) {
      draft.push({
        remove: { index: index, howMany: howMany }
      });
      list.splice(index, howMany);
    });

    runtime.touch(vv);

    /* No further action necessary; spliced earlier. */
    return this;
  };
  
  var remove = function remove(/*...*/) {
    var args = Array.prototype.slice.call(arguments);
    return prune.call(this, function (item) { return args.has(item); });
  };

  var swap = function swap(i, j) {
    var vv = this.unwrap();

    var list = vv.value;
    /* Out-of-bounds indices will be ignored. */
    if (i === j || i < 0 || list.length <= i || j < 0 || list.length <= j) {
      return;
    }

    /* We want to guarantee to subscribers that i < j. */
    var tmp = i;
    if (i > j) {
      i = j;
      j = tmp;
    }

    vv.draft("value").push({ swap: [i, j] });

    runtime.touch(vv);

    tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;

    return this;
  };

  proxies.makeArrayProxy = function makeArrayProxy(vv) {
    ASSERT(vv.cellType = "interface",
      "cannot make array proxy for " + vv);
    ASSERT(Array.isArray(vv.value),
      "array proxies are for array values only");

    var proxy = function hdArrayProxy(a0, a1) {
      if (arguments.length === 1) {
        /* Array assignment: proxy(other) */
        vv.set(a0);
        runtime.touch(vv);
      } else if (arguments.length === 2) {
        /* Element assignment: proxy(index, elt) */
        vv.value[a0] = a1;
        vv.draft("value").push({
          remove: { index: a0, howMany: 1 }
        }, {
          add:    { index: a0, items: [a1] }
        });
        runtime.touch(vv);
      } else {
        return evaluator.get(vv);
      }
    };

    addArrayProxyMethods(proxy);

    return proxies.finishProxy(vv, proxy);
  };

  var addArrayProxyMethods
    = proxies.addArrayProxyMethods
    = function addArrayProxyMethods(o)
  {
    o.clear   = clear;
    o.pop     = pop;
    o.push    = push;
    o.reverse = reverse;
    o.shift   = shift;
    o.sort    = sort;
    o.splice  = splice;
    o.unshift = unshift;
    o.prune   = prune;
    o.remove  = remove;
    o.swap    = swap;
  };

  hd.isArray = function isArray(proxy) {
    return hd.isProxy(proxy) && Array.isArray(proxy.unwrap().value);
  };

}());

