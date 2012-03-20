(function () {

  var Model = function () {
    this.all = hd.variable(false);
    this.a = hd.variable();
    this.b = hd.variable();
    this.c = hd.variable();

    hd.constraint()
      .method(this.all, function () {
        return (this.a() === this.b() && this.b() === this.c())
          ? this.a()
          : false;
      })
      .method([this.a, this.b, this.c], function () {
        return [this.all(), this.all(), this.all()];
      });

    this.result = hd.command(function () {
      return { a : this.a(), b : this.b(), c : this.c() };
    });
  };

  var grouped_options = {
    getModel : function () {
      return hd.model(new Model());
    }
  };

  namespace.open("hottest").grouped_options = grouped_options;

}());

