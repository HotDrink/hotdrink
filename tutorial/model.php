<?php

$model = <<<EOS
var Model = hd.model(function () {
    this.greeting = hd.variable("Hello, World!");
});

$(document).ready(function () {
    hd.bind(new Model);
});
EOS;

$view = <<<EOS
<span data-bind="text: greeting">Please enable JavaScript.</span>
EOS;

include "template.php";

