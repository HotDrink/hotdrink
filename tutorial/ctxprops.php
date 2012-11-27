<?php

$model = <<<EOS
$(document).ready(function () {
  hd.bind({ name: "James" });
});
EOS;

$view = <<<EOS
Howdy, <span data-bind="text: name"></span>!
EOS;

include "template.php";

