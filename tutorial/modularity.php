<?php

$model = <<<EOS
var Model = hd.model(function (name) {
  this.name = hd.variable(name);
});

$(function () {
  hd.bind(new Model("James"));
});
EOS;

$view = <<<EOS
<p>
  Name: <input type="text" data-bind="textbox: name" />
</p>
<p>
  Howdy, <span data-bind="text: name"></span>!
</p>
EOS;

include "template.php";

