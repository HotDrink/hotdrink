(function(){

function sum( a, b ) { return a + b; }
function diff( a, b ) { return a - b; }

model = new hd.ModelBuilder()
  .variables( {a0: 0, b0: 0, a1: 0, b1: 0, a2: 0, b2: 0, a3: 0, b3: 0, a4: 0, b4: 0, a5: 0} )

  .constraint( 'a0, a1, b0' )
  .method( 'a0, a1 -> b0', sum  )
  .method( 'b0, a0 -> a1', diff )
  .method( 'b0, a1 -> a0', diff )

  .constraint( 'a1, a2, b1' )
  .method( 'a1, a2 -> b1', sum  )
  .method( 'b1, a1 -> a2', diff )
  .method( 'b1, a2 -> a1', diff )

  .constraint( 'a2, a3, b2' )
  .method( 'a2, a3 -> b2', sum  )
  .method( 'b2, a2 -> a3', diff )
  .method( 'b2, a3 -> a2', diff )

  .constraint( 'a3, a4, b3' )
  .method( 'a3, a4 -> b3', sum  )
  .method( 'b3, a3 -> a4', diff )
  .method( 'b3, a4 -> a3', diff )

  .constraint( 'a4, a5, b4' )
  .method( 'a4, a5 -> b4', sum  )
  .method( 'b4, a4 -> a5', diff )
  .method( 'b4, a5 -> a4', diff )

  .end()

})();
