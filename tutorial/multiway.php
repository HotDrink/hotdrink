<?php

$model = <<<EOS
var Model = hd.model(function () {
  this.length = hd.variable(3);
  this.width  = hd.variable(4);
  this.area   = hd.variable();

  hd.constraint()
    .method(this.length, function () {
      return this.area() / this.width();
    })
    .method(this.width, function () {
      return this.area() / this.length();
    })
    .method(this.area, function () {
      return this.length() * this.width();
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
</p>
EOS;

include "template.php";

