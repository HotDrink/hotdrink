var namespace = (function () {

  var open1 = function (ns, parent) {
    //if (typeof parent === "undefined") {
      //parent = window;
    //}
    ASSERT(
      typeof parent === "object"
      || typeof parent === "function",
      "parent of \"" + ns + "\" is not a namespace");
    if (!(ns in parent)) {
      parent[ns] = {};
    }
    var result = parent[ns];
    ASSERT(
      typeof result === "object"
      || typeof result === "function",
      "\"" + ns + "\" is not a namespace");
    return result;
  };

  var open = function (path) {
    var hierarchy = path.split(".");
    var parent = window;
    hierarchy.forEach(function (ns) {
      parent = open1(ns, parent);
    });
    return parent;
  };

  var extend = function (path, names) {
    var ns = open(path);
    Object.keys(names).forEach(function (name) {
      ns[name] = names[name];
    });
  };

  return {
    open : open,
    extend : extend
  };

}());

