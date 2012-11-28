<?php

$model = <<<EOS
var Model = hd.model(function () {
  this.length    = hd.variable(3);
  this.width     = hd.variable(4);
  this.area      = hd.variable();
  this.perimeter = hd.variable();

  hd.constraint(this.width)
    .method(this.length, function () {
      return this.area() / this.width();
    })
    .method(this.area, function () {
      return this.length() * this.width();
    });

  hd.constraint([this.length, this.width, this.perimeter])
    .method(this.width, function () {
      return (this.perimeter() / 2) - this.length();
    })
    .method(this.perimeter, function () {
      return 2 * (this.length() + this.width());
    });
});

$(function () {
  var model = new Model;
  hd.bind(model);
  model.area(20);
  model.perimeter(18);
  // If we had not declared each constraint's variables, a cycle would appear
  // here because HotDrink would choose the two methods that write the least 
  // recently edited variables (length and width).
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

