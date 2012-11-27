<?php

$model = <<<EOS
$(document).ready(function () {
  hd.bind("James");
});
EOS;

$view = <<<EOS
Howdy, <span data-bind="text: \$this"></span>!
EOS;

include "template.php";

