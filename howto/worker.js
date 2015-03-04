importScripts( 'fn-worker.js' ); 

function slowSum( a, b ) {
  var n;
  if (b < 0) {
    n = -1;
    b = -b;
  }
  else {
    n = 1;
  }
  for (var i = 0; i < b; ++i, ++n) {
    a += n - i;
  }
  return a;
}

function slowDiff( a, b ) {
  return slowSum( a, -b );
}
