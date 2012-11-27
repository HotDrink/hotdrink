<?php

$model = <<<EOS
var Model = hd.model(function () {
  this.firstName = hd.variable("James");
  this.lastName  = hd.variable("Bond");
  this.fullName  = hd.computed(function () {
    return this.firstName() + " " + this.lastName();
  });
});

$(document).ready(function () {
  hd.bind(new Model);
});
EOS;

$view = <<<EOS
<p>
  First name: <input type="text" data-bind="textbox: firstName" />
  <br />
  Last name: <input type="text" data-bind="textbox: lastName" />
</p>
<p>
  Howdy, <span data-bind="text: fullName"></span>!
</p>
EOS;

include "template.php";

