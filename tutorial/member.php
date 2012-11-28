<?php

$model = <<<EOS
var model = { name: "James" };

$(function () {
  hd.bind(model);
});
EOS;

$view = <<<EOS
Howdy, <span data-bind="text: \$this.name"></span>!
EOS;

include "template.php";

