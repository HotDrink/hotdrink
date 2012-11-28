<?php

$model = <<<EOS
var model = { name: "James" };

$(function () {
  hd.bind(model);
});
EOS;

$view = <<<EOS
Howdy, <span data-bind="text: name"></span>!
EOS;

include "template.php";

