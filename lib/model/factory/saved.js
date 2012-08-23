(function () {

  var factory    = hd.__private.factory;
  var PROTO_NAME = hd.PROTO_NAME;

  var isIdentical = function isIdentical(a, b) { return a === b; };

  factory.save = function save(here, isEqual) {
    var model = factory.contexts[0];
    ASSERT(model, "expected context for saved variable");
      
    isEqual   = isEqual || isIdentical;
    var there = factory.variable(here());
    var pair  = {
      here:  here,
      there: there
    };

    var pairs = model[PROTO_NAME].savedPairs;

    if (!pairs) {

      pairs = model[PROTO_NAME].savedPairs = [];

      var isSaved = factory.computed(function () {
        return pairs.every(function (pair) {
          return isEqual(pair.here(), pair.there());
        });
      }, function (truthy) {
        if (truthy) {
          pairs.forEach(function (pair) {
            pair.there(pair.here());
          }
        });
      });

    }

    pairs.push(pair);
  };

  hd.save = factory.save;

});

