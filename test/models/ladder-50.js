(function() {

function avg( x, y ) { return (x + y)/2; }
function rev( avg, x ) { return 2*avg - x; }

model = new hd.ModelBuilder()
  .variables( {a0: 0, b0: 0, a1: 0, b1: 0, a2: 0, b2: 0, a3: 0, b3: 0, a4: 0, b4: 0, a5: 0, b5: 0, a6: 0, b6: 0, a7: 0, b7: 0, a8: 0, b8: 0, a9: 0, b9: 0, a10: 0, b10: 0, a11: 0, b11: 0, a12: 0, b12: 0, a13: 0, b13: 0, a14: 0, b14: 0, a15: 0, b15: 0, a16: 0, b16: 0, a17: 0, b17: 0, a18: 0, b18: 0, a19: 0, b19: 0, a20: 0, b20: 0, a21: 0, b21: 0, a22: 0, b22: 0, a23: 0, b23: 0, a24: 0, b24: 0} )

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

  .constraint( 'a9, a10, b9' )
  .method( 'a9, a10 -> b9', avg )
  .method( 'b9, a9 -> a10', rev )
  .method( 'b9, a10 -> a9', rev )

  .constraint( 'b9, b10, a10' )
  .method( 'b9, b10 -> a10', avg )
  .method( 'a10, b9 -> b10', rev )
  .method( 'a10, b10 -> b9', rev )

  .constraint( 'a10, a11, b10' )
  .method( 'a10, a11 -> b10', avg )
  .method( 'b10, a10 -> a11', rev )
  .method( 'b10, a11 -> a10', rev )

  .constraint( 'b10, b11, a11' )
  .method( 'b10, b11 -> a11', avg )
  .method( 'a11, b10 -> b11', rev )
  .method( 'a11, b11 -> b10', rev )

  .constraint( 'a11, a12, b11' )
  .method( 'a11, a12 -> b11', avg )
  .method( 'b11, a11 -> a12', rev )
  .method( 'b11, a12 -> a11', rev )

  .constraint( 'b11, b12, a12' )
  .method( 'b11, b12 -> a12', avg )
  .method( 'a12, b11 -> b12', rev )
  .method( 'a12, b12 -> b11', rev )

  .constraint( 'a12, a13, b12' )
  .method( 'a12, a13 -> b12', avg )
  .method( 'b12, a12 -> a13', rev )
  .method( 'b12, a13 -> a12', rev )

  .constraint( 'b12, b13, a13' )
  .method( 'b12, b13 -> a13', avg )
  .method( 'a13, b12 -> b13', rev )
  .method( 'a13, b13 -> b12', rev )

  .constraint( 'a13, a14, b13' )
  .method( 'a13, a14 -> b13', avg )
  .method( 'b13, a13 -> a14', rev )
  .method( 'b13, a14 -> a13', rev )

  .constraint( 'b13, b14, a14' )
  .method( 'b13, b14 -> a14', avg )
  .method( 'a14, b13 -> b14', rev )
  .method( 'a14, b14 -> b13', rev )

  .constraint( 'a14, a15, b14' )
  .method( 'a14, a15 -> b14', avg )
  .method( 'b14, a14 -> a15', rev )
  .method( 'b14, a15 -> a14', rev )

  .constraint( 'b14, b15, a15' )
  .method( 'b14, b15 -> a15', avg )
  .method( 'a15, b14 -> b15', rev )
  .method( 'a15, b15 -> b14', rev )

  .constraint( 'a15, a16, b15' )
  .method( 'a15, a16 -> b15', avg )
  .method( 'b15, a15 -> a16', rev )
  .method( 'b15, a16 -> a15', rev )

  .constraint( 'b15, b16, a16' )
  .method( 'b15, b16 -> a16', avg )
  .method( 'a16, b15 -> b16', rev )
  .method( 'a16, b16 -> b15', rev )

  .constraint( 'a16, a17, b16' )
  .method( 'a16, a17 -> b16', avg )
  .method( 'b16, a16 -> a17', rev )
  .method( 'b16, a17 -> a16', rev )

  .constraint( 'b16, b17, a17' )
  .method( 'b16, b17 -> a17', avg )
  .method( 'a17, b16 -> b17', rev )
  .method( 'a17, b17 -> b16', rev )

  .constraint( 'a17, a18, b17' )
  .method( 'a17, a18 -> b17', avg )
  .method( 'b17, a17 -> a18', rev )
  .method( 'b17, a18 -> a17', rev )

  .constraint( 'b17, b18, a18' )
  .method( 'b17, b18 -> a18', avg )
  .method( 'a18, b17 -> b18', rev )
  .method( 'a18, b18 -> b17', rev )

  .constraint( 'a18, a19, b18' )
  .method( 'a18, a19 -> b18', avg )
  .method( 'b18, a18 -> a19', rev )
  .method( 'b18, a19 -> a18', rev )

  .constraint( 'b18, b19, a19' )
  .method( 'b18, b19 -> a19', avg )
  .method( 'a19, b18 -> b19', rev )
  .method( 'a19, b19 -> b18', rev )

  .constraint( 'a19, a20, b19' )
  .method( 'a19, a20 -> b19', avg )
  .method( 'b19, a19 -> a20', rev )
  .method( 'b19, a20 -> a19', rev )

  .constraint( 'b19, b20, a20' )
  .method( 'b19, b20 -> a20', avg )
  .method( 'a20, b19 -> b20', rev )
  .method( 'a20, b20 -> b19', rev )

  .constraint( 'a20, a21, b20' )
  .method( 'a20, a21 -> b20', avg )
  .method( 'b20, a20 -> a21', rev )
  .method( 'b20, a21 -> a20', rev )

  .constraint( 'b20, b21, a21' )
  .method( 'b20, b21 -> a21', avg )
  .method( 'a21, b20 -> b21', rev )
  .method( 'a21, b21 -> b20', rev )

  .constraint( 'a21, a22, b21' )
  .method( 'a21, a22 -> b21', avg )
  .method( 'b21, a21 -> a22', rev )
  .method( 'b21, a22 -> a21', rev )

  .constraint( 'b21, b22, a22' )
  .method( 'b21, b22 -> a22', avg )
  .method( 'a22, b21 -> b22', rev )
  .method( 'a22, b22 -> b21', rev )

  .constraint( 'a22, a23, b22' )
  .method( 'a22, a23 -> b22', avg )
  .method( 'b22, a22 -> a23', rev )
  .method( 'b22, a23 -> a22', rev )

  .constraint( 'b22, b23, a23' )
  .method( 'b22, b23 -> a23', avg )
  .method( 'a23, b22 -> b23', rev )
  .method( 'a23, b23 -> b22', rev )

  .constraint( 'a23, a24, b23' )
  .method( 'a23, a24 -> b23', avg )
  .method( 'b23, a23 -> a24', rev )
  .method( 'b23, a24 -> a23', rev )

  .constraint( 'b23, b24, a24' )
  .method( 'b23, b24 -> a24', avg )
  .method( 'a24, b23 -> b24', rev )
  .method( 'a24, b24 -> b23', rev )

  .end()

})();
