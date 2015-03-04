(function() {

function right( x ) {
  return x + 1;
}

function left( x ) {
  return x - 1;
}

model = new hd.ModelBuilder()
  .variables( {v0: 0, v1: 0, v2: 0, v3: 0, v4: 0, v5: 0, v6: 0, v7: 0, v8: 0, v9: 0} )

  .constraint( 'v0, v1' )
  .method( 'v0 -> v1', right )
  .method( 'v1 -> v0', left )

  .constraint( 'v1, v2' )
  .method( 'v1 -> v2', right )
  .method( 'v2 -> v1', left )

  .constraint( 'v2, v3' )
  .method( 'v2 -> v3', right )
  .method( 'v3 -> v2', left )

  .constraint( 'v3, v4' )
  .method( 'v3 -> v4', right )
  .method( 'v4 -> v3', left )

  .constraint( 'v4, v5' )
  .method( 'v4 -> v5', right )
  .method( 'v5 -> v4', left )

  .constraint( 'v5, v6' )
  .method( 'v5 -> v6', right )
  .method( 'v6 -> v5', left )

  .constraint( 'v6, v7' )
  .method( 'v6 -> v7', right )
  .method( 'v7 -> v6', left )

  .constraint( 'v7, v8' )
  .method( 'v7 -> v8', right )
  .method( 'v8 -> v7', left )

  .constraint( 'v8, v9' )
  .method( 'v8 -> v9', right )
  .method( 'v9 -> v8', left )

  .end()

})();
