(function () {

  var Model = function () {
    this.initial_height = hd.variable(5*300);
    this.initial_width = hd.variable(7*300);

    this.absolute_height = hd.variable(this.initial_height());
    this.absolute_width = hd.variable();

    this.relative_height = hd.variable();
    this.relative_width = hd.variable();

    this.preserve_ratio = hd.variable(true);

    hd.constraint()
      .method(this.absolute_height, function () {
        return this.initial_height() * this.relative_height() / 100;
      })
      .method(this.relative_height, function () {
        return 100 * this.absolute_height() / this.initial_height();
      });

    hd.constraint()
      .method(this.absolute_width, function () {
        return this.initial_width() * this.relative_width() / 100;
      })
      .method(this.relative_width, function () {
        return 100 * this.absolute_width() / this.initial_width();
      });

    hd.constraint()
      .method(this.relative_height, function () {
        return this.preserve_ratio()
          ? this.relative_width()
          : this.relative_height();
      })
      .method(this.relative_width, function () {
        return this.preserve_ratio()
          ? this.relative_height()
          : this.relative_width();
      });

    this.result = hd.command(function () {
      return { height : this.absolute_height(),
               width : this.absolute_width() };
    });
  };

  var resize_image = {
    getModel : function () {
      return hd.model(new Model());
    }
  };

  hottest.resize_image = resize_image;

}());

