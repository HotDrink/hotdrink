<?php

$model = <<<EOS
$(document).ready(function () {
  hd.binders["text"]($("#view"), "James");
  hd.binders["attr"]($("#view"), { title: "007" });
});
EOS;

$view = <<<EOS
Howdy, <span id="view"></span>!
EOS;

include "template.php";

