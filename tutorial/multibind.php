<?php

$model = <<<EOS
var model = {
  name:     "James",
  codename: "007"
}

$(document).ready(function () {
  hd.bind(model);
});
EOS;

$view = <<<EOS
Howdy, <span data-bind="text: name, attr: { title: codename }"></span>!
EOS;

include "template.php";

