(function() {

function avg( x, y ) { return (x + y)/2; }
function rev( avg, x ) { return 2*avg - x; }

model = new hd.ModelBuilder()
  .variables( {a0: 0, b0: 0, a1: 0, b1: 0, a2: 0, b2: 0, a3: 0, b3: 0, a4: 0, b4: 0} )

  .constraint( 'a0, a1, b0' )
  .method( 'a0, a1 -> b0', avg )
  .method( 'b0, a0 -> a1', rev )
  .method( 'b0, a1 -> a0', rev )

  .constraint( 'b0, b1, a1' )
  .method( 'b0, b1 -> a1', avg )
  .method( 'a1, b0 -> b1', rev )
  .method( 'a1, b1 -> b0', rev )

  .constraint( 'a1, a2, b1' )
  .method( 'a1, a2 -> b1', avg )
  .method( 'b1, a1 -> a2', rev )
  .method( 'b1, a2 -> a1', rev )

  .constraint( 'b1, b2, a2' )
  .method( 'b1, b2 -> a2', avg )
  .method( 'a2, b1 -> b2', rev )
  .method( 'a2, b2 -> b1', rev )

  .constraint( 'a2, a3, b2' )
  .method( 'a2, a3 -> b2', avg )
  .method( 'b2, a2 -> a3', rev )
  .method( 'b2, a3 -> a2', rev )

  .constraint( 'b2, b3, a3' )
  .method( 'b2, b3 -> a3', avg )
  .method( 'a3, b2 -> b3', rev )
  .method( 'a3, b3 -> b2', rev )

  .constraint( 'a3, a4, b3' )
  .method( 'a3, a4 -> b3', avg )
  .method( 'b3, a3 -> a4', rev )
  .method( 'b3, a4 -> a3', rev )

  .constraint( 'b3, b4, a4' )
  .method( 'b3, b4 -> a4', avg )
  .method( 'a4, b3 -> b4', rev )
  .method( 'a4, b4 -> b3', rev )

  .end()

})();
