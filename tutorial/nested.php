<?php

$model = <<<EOS
var model = {
  name:    "James Bond",
  contact: {
    email: "bond@mi6.gov.uk"
  }
};

$(function () {
  hd.bind(model);
});
EOS;

$view = <<<EOS
<p>
  You may reach <span data-bind="text: name"></span> at
</p>
<ul data-bind="if: contact">
  <li data-bind="if: contact.email">
    <a data-bind="text: contact.email, attr: { href: 'mailto:' + contact.email }"></a>
  </li>
</ul>
EOS;

include "template.php";

