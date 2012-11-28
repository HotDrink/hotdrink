<?php

$model = <<<EOS
var model = "James";

$(function () {
  hd.bind(model);
});
EOS;

$view = <<<EOS
Howdy, <span data-bind="text: \$this"></span>!
EOS;

include "template.php";

