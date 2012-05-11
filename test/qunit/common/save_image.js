(function () {

  var Model = hd.model(function Model() {
    this.fileName = hd.variable("");
    this.fileType = hd.variable("bmp");
    this.compressionRatio = hd.variable(100);
    this.imageQuality = hd.variable(100);

    hd.constraint()
      .method(this.compressionRatio, function () {
        return (100 - (4 * (100 - this.imageQuality())));
      })
      .method(this.imageQuality, function () {
        return (100 - ((100 - this.compressionRatio()) / 4));
      });

    this.result = hd.command(function () {
      var r = { type : this.fileType(), name : this.fileName() };
      if (this.fileType() === "jpeg") r.ratio = this.compressionRatio();
      return r;
    });

    hd.precondition(this.result, function () { return this.fileName() !== ""; });
  });

  hottest.saveImage = {
    Model: Model
  };

}());

