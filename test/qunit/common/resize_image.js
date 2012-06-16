(function () {

  var Model = hd.model(function Model() {
    this.initialHeight = hd.variable(5*300);
    this.initialWidth = hd.variable(7*300);

    this.absoluteHeight = hd.variable(this.initialHeight());
    this.absoluteWidth = hd.variable();

    this.relativeHeight = hd.variable();
    this.relativeWidth = hd.variable();

    this.preserveRatio = hd.variable(true);

    hd.constraint()
      .method(this.absoluteHeight, function () {
        return this.initialHeight() * this.relativeHeight() / 100;
      })
      .method(this.relativeHeight, function () {
        return 100 * this.absoluteHeight() / this.initialHeight();
      });

    hd.constraint()
      .method(this.absoluteWidth, function () {
        return this.initialWidth() * this.relativeWidth() / 100;
      })
      .method(this.relativeWidth, function () {
        return 100 * this.absoluteWidth() / this.initialWidth();
      });

    hd.constraint()
      .method(this.relativeHeight, function () {
        return this.preserveRatio()
          ? this.relativeWidth()
          : this.relativeHeight();
      })
      .method(this.relativeWidth, function () {
        return this.preserveRatio()
          ? this.relativeHeight()
          : this.relativeWidth();
      });

    this.result = hd.command(function () {
      return { height : this.absoluteHeight(),
               width : this.absoluteWidth() };
    });
  });

  hottest.resizeImage = {
    Model: Model
  };

}());

