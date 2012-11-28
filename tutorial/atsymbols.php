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
  <button type="button" data-bind="click: @ alert('Howdy, ' + name() + '!') @">
    Howdy!
  </button>
</p>
EOS;

include "template.php";

