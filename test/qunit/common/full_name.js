(function () {

  var Model = hd.model(function Model() {
    this.firstName = hd.variable("John");
    this.lastName = hd.variable("Smith");
    this.fullName = hd.computed(function () {
      return this.firstName() + " " + this.lastName();
    });
  });

  hottest.fullName = {
    Model: Model
  };

}());

