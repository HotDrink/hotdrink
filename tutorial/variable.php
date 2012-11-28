<?php

$model = <<<EOS
var model = {
  name: hd.variable("James")
};

$(document).ready(function () {
  hd.bind(model);
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

