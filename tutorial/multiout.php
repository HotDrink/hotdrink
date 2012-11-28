<?php

$model = <<<EOS
var Model = hd.model(function () {
  this.length    = hd.variable(3);
  this.width     = hd.variable(4);
  this.area      = hd.variable();
  this.perimeter = hd.variable();

  hd.constraint()
    .method([this.area, this.perimeter], function () {
      return [
        this.length() * this.width(),      // first comes area,
        2 * (this.length() + this.width()) // then perimeter
      ];
    })
    .method([this.length, this.width], function () {
      var negb = this.perimeter() / 2;
      var discriminant = (negb * negb) - (4 * this.area());

      if (discriminant < 0) return [0, 0]; // no real roots :(
      
      this.length((negb + Math.sqrt(discriminant)) / 2);
      this.width((negb - Math.sqrt(discriminant)) / 2);
    });
});

$(document).ready(function () {
  hd.bind(new Model);
});
EOS;

$view = <<<EOS
<p>
  Length: <input type="text" data-bind="number: length" />
  <br />
  Width: <input type="text" data-bind="number: width" />
  <br />
  Area: <input type="text" data-bind="number: area" />
  <br />
  Perimeter: <input type="text" data-bind="number: perimeter" />
</p>
EOS;

include "template.php";

