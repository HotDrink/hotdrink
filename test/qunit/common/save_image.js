(function () {

  var Model = function () {
    this.file_name = hd.variable("");
    this.file_type = hd.variable("bmp");
    this.compression_ratio = hd.variable(100);
    this.image_quality = hd.variable(100);

    hd.constraint()
      .method(this.compression_ratio, function () {
        return (100 - (4 * (100 - this.image_quality())));
      })
      .method(this.image_quality, function () {
        return (100 - ((100 - this.compression_ratio()) / 4));
      });

    this.result = hd.command(function () {
      var r = { type : this.file_type(), name : this.file_name() };
      if (this.file_type() === "jpeg") r.ratio = this.compression_ratio();
      return r;
    });

    hd.precondition(this.result, function () { return this.file_name() !== ""; });
  };

  var save_image = {
    getModel : function () {
      return hd.model(new Model());
    }
  };

  namespace.open("hottest").save_image = save_image;

}());

