<?php

$model = <<<EOS
var Model = hd.model(function () {
    this.name      = hd.variable("John");
    this.greeting  = hd.computed(function () {
        return "Hello, " + this.name() + "!";
    });
});

$(document).ready(function () {
    hd.bind(new Model);
});
EOS;

$view = <<<EOS
<p>What's your name? <input type="text" data-bind="textbox: name"/></p>
<span data-bind="text: greeting">Please enable JavaScript.</span>
EOS;

include "template.php";

