(function () {

  var Model = hd.model(function Model() {
    this.text = hd.computed(function () { return "Hello, World!"; });
    this.result = hd.command(function () { return this.text(); });
  });

  hottest.helloWorld = {
    Model: Model
  };

}());

