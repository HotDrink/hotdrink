<?php

$model = <<<EOS
var model = "James";

$(document).ready(function () {
  hd.binders["text"]($("#view"), model);
});
EOS;

$view = <<<EOS
Howdy, <span id="view"></span>!
EOS;

include "template.php";

