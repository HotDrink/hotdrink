<!DOCTYPE html>
<html>
<head>
  <script type="text/javascript" src="https://raw.github.com/kriskowal/es5-shim/master/es5-shim.min.js"></script>
  <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
<?php if ($DEBUG) { ?>
  <script type="text/javascript" src="/hotdrink-debug.js"></script>
<?php } else { ?>
  <script type="text/javascript" src="/hotdrink.js"></script>
<?php } ?>
  <link rel="stylesheet" href="main.css"/>
  <title>Tutorial | HotDrink</title>
  <script type="text/javascript">

<?= $model ?>


  </script>
</head>
<body>
  <noscript>Please enable JavaScript.</noscript>
  <div class="view">

<?= $view ?>


  </div>
</body>
</html>

