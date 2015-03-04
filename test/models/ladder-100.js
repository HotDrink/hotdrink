(function() {

function avg( x, y ) { return (x + y)/2; }
function rev( avg, x ) { return 2*avg - x; }

model = new hd.ModelBuilder()
  .variables( {a0: 0, b0: 0, a1: 0, b1: 0, a2: 0, b2: 0, a3: 0, b3: 0, a4: 0, b4: 0, a5: 0, b5: 0, a6: 0, b6: 0, a7: 0, b7: 0, a8: 0, b8: 0, a9: 0, b9: 0, a10: 0, b10: 0, a11: 0, b11: 0, a12: 0, b12: 0, a13: 0, b13: 0, a14: 0, b14: 0, a15: 0, b15: 0, a16: 0, b16: 0, a17: 0, b17: 0, a18: 0, b18: 0, a19: 0, b19: 0, a20: 0, b20: 0, a21: 0, b21: 0, a22: 0, b22: 0, a23: 0, b23: 0, a24: 0, b24: 0, a25: 0, b25: 0, a26: 0, b26: 0, a27: 0, b27: 0, a28: 0, b28: 0, a29: 0, b29: 0, a30: 0, b30: 0, a31: 0, b31: 0, a32: 0, b32: 0, a33: 0, b33: 0, a34: 0, b34: 0, a35: 0, b35: 0, a36: 0, b36: 0, a37: 0, b37: 0, a38: 0, b38: 0, a39: 0, b39: 0, a40: 0, b40: 0, a41: 0, b41: 0, a42: 0, b42: 0, a43: 0, b43: 0, a44: 0, b44: 0, a45: 0, b45: 0, a46: 0, b46: 0, a47: 0, b47: 0, a48: 0, b48: 0, a49: 0, b49: 0} )

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

  .constraint( 'a24, a25, b24' )
  .method( 'a24, a25 -> b24', avg )
  .method( 'b24, a24 -> a25', rev )
  .method( 'b24, a25 -> a24', rev )

  .constraint( 'b24, b25, a25' )
  .method( 'b24, b25 -> a25', avg )
  .method( 'a25, b24 -> b25', rev )
  .method( 'a25, b25 -> b24', rev )

  .constraint( 'a25, a26, b25' )
  .method( 'a25, a26 -> b25', avg )
  .method( 'b25, a25 -> a26', rev )
  .method( 'b25, a26 -> a25', rev )

  .constraint( 'b25, b26, a26' )
  .method( 'b25, b26 -> a26', avg )
  .method( 'a26, b25 -> b26', rev )
  .method( 'a26, b26 -> b25', rev )

  .constraint( 'a26, a27, b26' )
  .method( 'a26, a27 -> b26', avg )
  .method( 'b26, a26 -> a27', rev )
  .method( 'b26, a27 -> a26', rev )

  .constraint( 'b26, b27, a27' )
  .method( 'b26, b27 -> a27', avg )
  .method( 'a27, b26 -> b27', rev )
  .method( 'a27, b27 -> b26', rev )

  .constraint( 'a27, a28, b27' )
  .method( 'a27, a28 -> b27', avg )
  .method( 'b27, a27 -> a28', rev )
  .method( 'b27, a28 -> a27', rev )

  .constraint( 'b27, b28, a28' )
  .method( 'b27, b28 -> a28', avg )
  .method( 'a28, b27 -> b28', rev )
  .method( 'a28, b28 -> b27', rev )

  .constraint( 'a28, a29, b28' )
  .method( 'a28, a29 -> b28', avg )
  .method( 'b28, a28 -> a29', rev )
  .method( 'b28, a29 -> a28', rev )

  .constraint( 'b28, b29, a29' )
  .method( 'b28, b29 -> a29', avg )
  .method( 'a29, b28 -> b29', rev )
  .method( 'a29, b29 -> b28', rev )

  .constraint( 'a29, a30, b29' )
  .method( 'a29, a30 -> b29', avg )
  .method( 'b29, a29 -> a30', rev )
  .method( 'b29, a30 -> a29', rev )

  .constraint( 'b29, b30, a30' )
  .method( 'b29, b30 -> a30', avg )
  .method( 'a30, b29 -> b30', rev )
  .method( 'a30, b30 -> b29', rev )

  .constraint( 'a30, a31, b30' )
  .method( 'a30, a31 -> b30', avg )
  .method( 'b30, a30 -> a31', rev )
  .method( 'b30, a31 -> a30', rev )

  .constraint( 'b30, b31, a31' )
  .method( 'b30, b31 -> a31', avg )
  .method( 'a31, b30 -> b31', rev )
  .method( 'a31, b31 -> b30', rev )

  .constraint( 'a31, a32, b31' )
  .method( 'a31, a32 -> b31', avg )
  .method( 'b31, a31 -> a32', rev )
  .method( 'b31, a32 -> a31', rev )

  .constraint( 'b31, b32, a32' )
  .method( 'b31, b32 -> a32', avg )
  .method( 'a32, b31 -> b32', rev )
  .method( 'a32, b32 -> b31', rev )

  .constraint( 'a32, a33, b32' )
  .method( 'a32, a33 -> b32', avg )
  .method( 'b32, a32 -> a33', rev )
  .method( 'b32, a33 -> a32', rev )

  .constraint( 'b32, b33, a33' )
  .method( 'b32, b33 -> a33', avg )
  .method( 'a33, b32 -> b33', rev )
  .method( 'a33, b33 -> b32', rev )

  .constraint( 'a33, a34, b33' )
  .method( 'a33, a34 -> b33', avg )
  .method( 'b33, a33 -> a34', rev )
  .method( 'b33, a34 -> a33', rev )

  .constraint( 'b33, b34, a34' )
  .method( 'b33, b34 -> a34', avg )
  .method( 'a34, b33 -> b34', rev )
  .method( 'a34, b34 -> b33', rev )

  .constraint( 'a34, a35, b34' )
  .method( 'a34, a35 -> b34', avg )
  .method( 'b34, a34 -> a35', rev )
  .method( 'b34, a35 -> a34', rev )

  .constraint( 'b34, b35, a35' )
  .method( 'b34, b35 -> a35', avg )
  .method( 'a35, b34 -> b35', rev )
  .method( 'a35, b35 -> b34', rev )

  .constraint( 'a35, a36, b35' )
  .method( 'a35, a36 -> b35', avg )
  .method( 'b35, a35 -> a36', rev )
  .method( 'b35, a36 -> a35', rev )

  .constraint( 'b35, b36, a36' )
  .method( 'b35, b36 -> a36', avg )
  .method( 'a36, b35 -> b36', rev )
  .method( 'a36, b36 -> b35', rev )

  .constraint( 'a36, a37, b36' )
  .method( 'a36, a37 -> b36', avg )
  .method( 'b36, a36 -> a37', rev )
  .method( 'b36, a37 -> a36', rev )

  .constraint( 'b36, b37, a37' )
  .method( 'b36, b37 -> a37', avg )
  .method( 'a37, b36 -> b37', rev )
  .method( 'a37, b37 -> b36', rev )

  .constraint( 'a37, a38, b37' )
  .method( 'a37, a38 -> b37', avg )
  .method( 'b37, a37 -> a38', rev )
  .method( 'b37, a38 -> a37', rev )

  .constraint( 'b37, b38, a38' )
  .method( 'b37, b38 -> a38', avg )
  .method( 'a38, b37 -> b38', rev )
  .method( 'a38, b38 -> b37', rev )

  .constraint( 'a38, a39, b38' )
  .method( 'a38, a39 -> b38', avg )
  .method( 'b38, a38 -> a39', rev )
  .method( 'b38, a39 -> a38', rev )

  .constraint( 'b38, b39, a39' )
  .method( 'b38, b39 -> a39', avg )
  .method( 'a39, b38 -> b39', rev )
  .method( 'a39, b39 -> b38', rev )

  .constraint( 'a39, a40, b39' )
  .method( 'a39, a40 -> b39', avg )
  .method( 'b39, a39 -> a40', rev )
  .method( 'b39, a40 -> a39', rev )

  .constraint( 'b39, b40, a40' )
  .method( 'b39, b40 -> a40', avg )
  .method( 'a40, b39 -> b40', rev )
  .method( 'a40, b40 -> b39', rev )

  .constraint( 'a40, a41, b40' )
  .method( 'a40, a41 -> b40', avg )
  .method( 'b40, a40 -> a41', rev )
  .method( 'b40, a41 -> a40', rev )

  .constraint( 'b40, b41, a41' )
  .method( 'b40, b41 -> a41', avg )
  .method( 'a41, b40 -> b41', rev )
  .method( 'a41, b41 -> b40', rev )

  .constraint( 'a41, a42, b41' )
  .method( 'a41, a42 -> b41', avg )
  .method( 'b41, a41 -> a42', rev )
  .method( 'b41, a42 -> a41', rev )

  .constraint( 'b41, b42, a42' )
  .method( 'b41, b42 -> a42', avg )
  .method( 'a42, b41 -> b42', rev )
  .method( 'a42, b42 -> b41', rev )

  .constraint( 'a42, a43, b42' )
  .method( 'a42, a43 -> b42', avg )
  .method( 'b42, a42 -> a43', rev )
  .method( 'b42, a43 -> a42', rev )

  .constraint( 'b42, b43, a43' )
  .method( 'b42, b43 -> a43', avg )
  .method( 'a43, b42 -> b43', rev )
  .method( 'a43, b43 -> b42', rev )

  .constraint( 'a43, a44, b43' )
  .method( 'a43, a44 -> b43', avg )
  .method( 'b43, a43 -> a44', rev )
  .method( 'b43, a44 -> a43', rev )

  .constraint( 'b43, b44, a44' )
  .method( 'b43, b44 -> a44', avg )
  .method( 'a44, b43 -> b44', rev )
  .method( 'a44, b44 -> b43', rev )

  .constraint( 'a44, a45, b44' )
  .method( 'a44, a45 -> b44', avg )
  .method( 'b44, a44 -> a45', rev )
  .method( 'b44, a45 -> a44', rev )

  .constraint( 'b44, b45, a45' )
  .method( 'b44, b45 -> a45', avg )
  .method( 'a45, b44 -> b45', rev )
  .method( 'a45, b45 -> b44', rev )

  .constraint( 'a45, a46, b45' )
  .method( 'a45, a46 -> b45', avg )
  .method( 'b45, a45 -> a46', rev )
  .method( 'b45, a46 -> a45', rev )

  .constraint( 'b45, b46, a46' )
  .method( 'b45, b46 -> a46', avg )
  .method( 'a46, b45 -> b46', rev )
  .method( 'a46, b46 -> b45', rev )

  .constraint( 'a46, a47, b46' )
  .method( 'a46, a47 -> b46', avg )
  .method( 'b46, a46 -> a47', rev )
  .method( 'b46, a47 -> a46', rev )

  .constraint( 'b46, b47, a47' )
  .method( 'b46, b47 -> a47', avg )
  .method( 'a47, b46 -> b47', rev )
  .method( 'a47, b47 -> b46', rev )

  .constraint( 'a47, a48, b47' )
  .method( 'a47, a48 -> b47', avg )
  .method( 'b47, a47 -> a48', rev )
  .method( 'b47, a48 -> a47', rev )

  .constraint( 'b47, b48, a48' )
  .method( 'b47, b48 -> a48', avg )
  .method( 'a48, b47 -> b48', rev )
  .method( 'a48, b48 -> b47', rev )

  .constraint( 'a48, a49, b48' )
  .method( 'a48, a49 -> b48', avg )
  .method( 'b48, a48 -> a49', rev )
  .method( 'b48, a49 -> a48', rev )

  .constraint( 'b48, b49, a49' )
  .method( 'b48, b49 -> a49', avg )
  .method( 'a49, b48 -> b49', rev )
  .method( 'a49, b49 -> b48', rev )

  .end()

})();
