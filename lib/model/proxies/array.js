(function () {

  var proxies   = hd.__private.proxies;
  var runtime   = hd.__private.runtime;
  var evaluator = hd.__private.evaluator;

  var clear = function clear() {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    vv.changeEvent = { set: true };

    runtime.touch(vv);
    
    vv.value = [];
  };
  
  var pop = function pop() {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    /* Abort when no change. */
    if (vv.value.length === 0) return;
    vv.changeEvent = {
      removes: [{ index: vv.value.length - 1, howMany: 1 }]
    };

    runtime.touch(vv);

    return vv.value.pop();
  };
  
  var push = function push() {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    vv.changeEvent = {
      adds: [{ index: vv.value.length, howMany: arguments.length }]
    };

    runtime.touch(vv);

    return Array.prototype.push.apply(vv.value, arguments);
  };
  
  var reverse = function reverse() {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    vv.changeEvent = { set: true };

    runtime.touch(vv);
    
    vv.value.reverse();
  };

  var shift = function shift() {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    /* Abort when no change. */
    if (vv.value.length === 0) return;
    vv.changeEvent = {
      removes: [{ index: 0, howMany: 1 }]
    };

    runtime.touch(vv);

    return vv.value.shift();
  };
  
  var sort = function sort(f) {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    vv.changeEvent = { set: true };

    runtime.touch(vv);
    
    vv.value.sort(f);
  };

  var splice = function splice(index, howMany/*...*/) {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");
    var list    = vv.value;
    var removes = undefined;
    var adds    = undefined;

    if (index < 0) {
      index = ((list.length + index) >= 0) ? (list.length + index) : 0;
    }

    if ((arguments.length == 1) || (howMany > list.length - index)) {
      howMany = list.length - index;
    }

    if (howMany > 0) {
      removes = [{ index: index, howMany: howMany }];
    }

    if (arguments.length > 2) {
      adds = [{ index: index, howMany: arguments.length - 2 }]
    }

    vv.changeEvent = {
      removes: removes,
      adds:    adds
    };

    runtime.touch(vv);

    return Array.prototype.splice.apply(vv.value, arguments);
  };

  var unshift = function unshift() {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");

    vv.changeEvent = {
      adds: [{ index: 0, howMany: arguments.length }]
    };

    runtime.touch(vv);

    return Array.prototype.unshift.apply(vv.value, arguments);
  };
  
  

  var prune = function prune(p) {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");
    var list    = vv.value;
    var removes = [];
    var i       = list.length;
    var howMany = 0;

    /* Instead of burdening each consumer with the task of sorting the
     * removals, we guarantee that removes are in back-to-front order. */
    for (; i > 0; --i) {
      /* Filter removes items that do *not* meet the predicate. */
      if (!p(list[i - 1])) {
        ++howMany;
      } else {
        if (howMany > 0) {
          removes.push({ index: i, howMany: howMany });
          howMany = 0;
        }
      }
    }

    if (howMany > 0) {
      removes.push({ index: i, howMany: howMany });
    }

    vv.changeEvent = { removes: removes };

    runtime.touch(vv);
    
    vv.value = list.filter(p);
  };
  
  var remove = function remove(/*...*/) {
    var vv = this.unwrap();
    ASSERT(!vv.isChanged(), "folding change events not supported");
    var list    = vv.value;
    var removes = [];
    var howMany = 0;
    var i = list.length;
    
    for (; i > 0; --i) {
      if (Array.prototype.indexOf.call(arguments, list[i - 1]) >= 0) {
        ++howMany;
      } else {
        removes.push({ index: i, howMany: howMany });
        howMany = 0;
      }
    }
    
    if (howMany > 0) {
      removes.push({ index: i, howMany: howMany });
    }
    
    /* Must be sorted in reverse order to be removed correctly */
    removes.sort(function(a, b) {
      return b.index - a.index;
    });

    vv.changeEvent = { removes: removes };
     
    runtime.touch(vv);
    
    var removed = [];
    for (i = 0; i < removes.length; ++i) {
      Array.prototype.push.apply(removed, 
        list.splice(removes[i].index, removes[i].howMany));
    }
    return removed;
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
        vv.changeEvent = {
          removes: [{ index: a0, howMany: 1 }],
          adds:    [{ index: a0, howMany: 1 }]
        };
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
    /* filter is deprecated: use prune instead */
    o.filter  = prune;
    o.remove  = remove;
  };

  hd.isArray = function isArray(proxy) {
    return hd.isProxy(proxy) && Array.isArray(proxy.unwrap().value);
  };

}());

