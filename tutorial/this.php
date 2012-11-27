<?php

$model = <<<EOS
var model = {
  length: hd.variable(3),
  width:  hd.variable(4),
  area:   hd.variable()
};

hd.constraint()
  .method(model.length, function () {
    // No hd.model here! Need to override "this".
    return this.area() / this.width();
  }, model)
  .method(model.width, function () {
    return this.area() / this.length();
  }, model)
  .method(model.area, function () {
    return this.length() * this.width();
  }, model);

model.report = hd.computed(function () {
  var isRound = Math.floor(this.area()) === this.area();
  return "That area is " + (isRound ? "" : "not ") + "a nice round number!";
}, model);

$(document).ready(function () {
  hd.bind(model);
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
  <span data-bind="text: report"></span>
</p>
EOS;

include "template.php";

