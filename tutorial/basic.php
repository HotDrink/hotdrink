<?php

$model = <<<EOS
var greeting = hd.variable("Hello, World!");
$(document).ready(function () {
    hd.bind({ greeting: greeting });
});
EOS;

$view = <<<EOS
<span data-bind="text: greeting">Please enable JavaScript.</span>
EOS;

include "template.php";

