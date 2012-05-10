(function () {

  var Model = function () {
    this.firstName = hd.variable("John");
    this.lastName = hd.variable("Smith");
    this.fullName = hd.computed(function () {
      return this.firstName() + " " + this.lastName();
    });
  };

  var full_name = {
    getModel : function () {
      return hd.model(new Model());
    }
  };

  hottest.full_name = full_name;

}());

