(function() {

function avg( x, y ) { return (x + y)/2; }
function rev( avg, x ) { return 2*avg - x; }

model = new hd.ModelBuilder()
  .variables( {a0: 0, b0: 0, a1: 0, b1: 0, a2: 0, b2: 0, a3: 0, b3: 0, a4: 0, b4: 0, a5: 0, b5: 0, a6: 0, b6: 0, a7: 0, b7: 0, a8: 0, b8: 0, a9: 0, b9: 0} )

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

  .constraint( 'a4, a5, b4' )
  .method( 'a4, a5 -> b4', avg )
  .method( 'b4, a4 -> a5', rev )
  .method( 'b4, a5 -> a4', rev )

  .constraint( 'b4, b5, a5' )
  .method( 'b4, b5 -> a5', avg )
  .method( 'a5, b4 -> b5', rev )
  .method( 'a5, b5 -> b4', rev )

  .constraint( 'a5, a6, b5' )
  .method( 'a5, a6 -> b5', avg )
  .method( 'b5, a5 -> a6', rev )
  .method( 'b5, a6 -> a5', rev )

  .constraint( 'b5, b6, a6' )
  .method( 'b5, b6 -> a6', avg )
  .method( 'a6, b5 -> b6', rev )
  .method( 'a6, b6 -> b5', rev )

  .constraint( 'a6, a7, b6' )
  .method( 'a6, a7 -> b6', avg )
  .method( 'b6, a6 -> a7', rev )
  .method( 'b6, a7 -> a6', rev )

  .constraint( 'b6, b7, a7' )
  .method( 'b6, b7 -> a7', avg )
  .method( 'a7, b6 -> b7', rev )
  .method( 'a7, b7 -> b6', rev )

  .constraint( 'a7, a8, b7' )
  .method( 'a7, a8 -> b7', avg )
  .method( 'b7, a7 -> a8', rev )
  .method( 'b7, a8 -> a7', rev )

  .constraint( 'b7, b8, a8' )
  .method( 'b7, b8 -> a8', avg )
  .method( 'a8, b7 -> b8', rev )
  .method( 'a8, b8 -> b7', rev )

  .constraint( 'a8, a9, b8' )
  .method( 'a8, a9 -> b8', avg )
  .method( 'b8, a8 -> a9', rev )
  .method( 'b8, a9 -> a8', rev )

  .constraint( 'b8, b9, a9' )
  .method( 'b8, b9 -> a9', avg )
  .method( 'a9, b8 -> b9', rev )
  .method( 'a9, b9 -> b8', rev )

  .end()

})();
