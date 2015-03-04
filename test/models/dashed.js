(function(){

function sum( a, b ) { return a + b; }
function diff( a, b ) { return a - b; }
function copy( a ) { return a; }

model = new hd.ModelBuilder()
  .variables( {a0: 0, b0: 0, a1: 0, b1: 0, a2: 0, a3: 0, b3: 0, a4: 0, b4: 0, a5: 0, a6: 0, b6: 0, a7: 0, b7: 0, a8: 0} )

  .constraint( 'a0, a1, b0' )
  .method( 'a0, a1 -> b0', sum  )
  .method( 'b0, a0 -> a1', diff )
  .method( 'b0, a1 -> a0', diff )

  .constraint( 'a1, a2, b1' )
  .method( 'a1, a2 -> b1', sum  )
  .method( 'b1, a1 -> a2', diff )
  .method( 'b1, a2 -> a1', diff )

  .constraint( 'a2, a3' )
  .method( 'a2 -> a3', copy )

  .constraint( 'a3, a4, b3' )
  .method( 'a3, a4 -> b3', sum  )
  .method( 'b3, a3 -> a4', diff )
  .method( 'b3, a4 -> a3', diff )

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

  .constraint( 'a7, a8, b7' )
  .method( 'a7, a8 -> b7', sum  )
  .method( 'b7, a7 -> a8', diff )
  .method( 'b7, a8 -> a7', diff )

  .end()

})();
