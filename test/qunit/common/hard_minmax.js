var min = function (a, b) { return (a < b) ? (a) : (b); };
var max = function (a, b) { return (a < b) ? (b) : (a); };

(function () {

  var Model = hd.model(function Model() {
    this.value = hd.variable(50);
    this.min = hd.variable(0);
    this.max = hd.variable(100);

    hd.constraint()
      .method([this.value, this.max], function () {
        var maxNext = max(this.min(), this.max());
        var valueNext = min(max(this.min(), this.value()), maxNext);
        return [valueNext, maxNext];
      })
      .method([this.value, this.min], function () {
        var minNext = min(this.min(), this.max());
        var valueNext = min(max(minNext, this.value()), this.max());
        return [valueNext, minNext];
      });

    this.result = hd.command(function () {
      return { value : this.value(), min : this.min(), max : this.max() };
    });

    hd.precondition(this.result, function () { this.min() >= 0; });

  });

  hottest.enforcedMinmax = {
    Model: Model
  };

}());

