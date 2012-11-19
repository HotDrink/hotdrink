hottest = (function () {

  var counter = function counter() {
    var f = function () {
      ++f.counter;
    };
    f.counter = 0;
    return f;
  };

  var elt = function elt(tag) {
    return $(tag).appendTo("#qunit-fixture");
  };

  return {
    counter: counter,
    elt:     elt
  };

}());

