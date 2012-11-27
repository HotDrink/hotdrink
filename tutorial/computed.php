<?php

$model = <<<EOS
var Model = hd.model(function () {
  this.length = hd.variable(3);
  this.width  = hd.variable(4);
  this.area   = hd.computed(function () {
    // Compute area from length and width.
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
  Area: <span data-bind="text: area"></span>
</p>
EOS;

include "template.php";

