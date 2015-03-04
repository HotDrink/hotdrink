(function() {

function sum( a, b, c, d, e, f, g, h, i ) {
  return a + b + c + d + e + f + g + h + i;
}

function diff( a, b, c, d, e, f, g, h, i ) {
  return a - b - c - d - e - f - g - h - i;
}

model = new hd.ModelBuilder()
  .variables( {a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1, i: 1, t: undefined} )

  .constraint( 'a, b, c, d, e, f, g, h, i, t' )
  .method( 'a, b, c, d, e, f, g, h, i -> t', sum )
  .method( 't, a, b, c, d, e, f, g, h -> i', diff )
  .method( 't, a, b, c, d, e, f, g, i -> h', diff )
  .method( 't, a, b, c, d, e, f, h, i -> g', diff )
  .method( 't, a, b, c, d, e, g, h, i -> f', diff )
  .method( 't, a, b, c, d, f, g, h, i -> e', diff )
  .method( 't, a, b, c, e, f, g, h, i -> d', diff )
  .method( 't, a, b, d, e, f, g, h, i -> c', diff )
  .method( 't, a, c, d, e, f, g, h, i -> b', diff )
  .method( 't, b, c, d, e, f, g, h, i -> a', diff )

  .end()

})();
