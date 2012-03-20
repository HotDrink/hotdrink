(function () {

  var Model = function () {
    this.text = hd.computed(function () { return "Hello, World!"; });
    this.result = hd.command(function () { return this.text(); });
  };

  var hello_world = {
    getModel : function () {
      return hd.model(new Model());
    }
  };

  namespace.open("hottest").hello_world = hello_world;

}());

