(function() {

function sum( a, b ) { return a + b; }
function diff( a, b ) { return a - b; }
function copy( a ) { return a; }

model = new hd.ModelBuilder()
  .variables( {a0: 0, b0: 0, a1: 0, a2: 0, b2: 0, a3: 0, a4: 0, b4: 0, a5: 0, a6: 0, b6: 0, a7: 0, a8: 0, b8: 0, a9: 0} )

  .constraint( 'a0, a1, b0' )
  .method( 'a0, a1 -> b0', sum  )
  .method( 'b0, a0 -> a1', diff )
  .method( 'b0, a1 -> a0', diff )

  .constraint( 'a1, a2' )
  .method( 'a1 -> a2', copy )

  .constraint( 'a2, a3, b2' )
  .method( 'a2, a3 -> b2', sum  )
  .method( 'b2, a2 -> a3', diff )
  .method( 'b2, a3 -> a2', diff )

  .constraint( 'a3, a4' )
  .method( 'a3 -> a4', copy )

  .constraint( 'a4, a5, b4' )
  .method( 'a4, a5 -> b4', sum  )
  .method( 'b4, a4 -> a5', diff )
  .method( 'b4, a5 -> a4', diff )

  .constraint( 'a5, a6' )
  .method( 'a5 -> a6', copy )

  .constraint( 'a6, a7, b6' )
  .method( 'a6, a7 -> b6', sum  )
  .method( 'b6, a6 -> a7', diff )
  .method( 'b6, a7 -> a6', diff )

  .constraint( 'a7, a8' )
  .method( 'a7 -> a8', copy )

  .constraint( 'a8, a9, b8' )
  .method( 'a8, a9 -> b8', sum  )
  .method( 'b8, a8 -> a9', diff )
  .method( 'b8, a9 -> a8', diff )

  .end()

})();
