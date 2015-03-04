(function() {

function right( x ) {
  return x + 1;
}

function left( x ) {
  return x - 1;
}

model = new hd.ModelBuilder()
  .variables( {v0: 0, v1: 0, v2: 0, v3: 0, v4: 0, v5: 0, v6: 0, v7: 0, v8: 0, v9: 0, v10: 0, v11: 0, v12: 0, v13: 0, v14: 0, v15: 0, v16: 0, v17: 0, v18: 0, v19: 0} )

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

  .constraint( 'v9, v10' )
  .method( 'v9 -> v10', right )
  .method( 'v10 -> v9', left )

  .constraint( 'v10, v11' )
  .method( 'v10 -> v11', right )
  .method( 'v11 -> v10', left )

  .constraint( 'v11, v12' )
  .method( 'v11 -> v12', right )
  .method( 'v12 -> v11', left )

  .constraint( 'v12, v13' )
  .method( 'v12 -> v13', right )
  .method( 'v13 -> v12', left )

  .constraint( 'v13, v14' )
  .method( 'v13 -> v14', right )
  .method( 'v14 -> v13', left )

  .constraint( 'v14, v15' )
  .method( 'v14 -> v15', right )
  .method( 'v15 -> v14', left )

  .constraint( 'v15, v16' )
  .method( 'v15 -> v16', right )
  .method( 'v16 -> v15', left )

  .constraint( 'v16, v17' )
  .method( 'v16 -> v17', right )
  .method( 'v17 -> v16', left )

  .constraint( 'v17, v18' )
  .method( 'v17 -> v18', right )
  .method( 'v18 -> v17', left )

  .constraint( 'v18, v19' )
  .method( 'v18 -> v19', right )
  .method( 'v19 -> v18', left )

  .end()

})();
