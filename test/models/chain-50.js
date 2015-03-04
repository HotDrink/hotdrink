(function() {

function right( x ) {
  return x + 1;
}

function left( x ) {
  return x - 1;
}

model = new hd.ModelBuilder()
  .variables( {v0: 0, v1: 0, v2: 0, v3: 0, v4: 0, v5: 0, v6: 0, v7: 0, v8: 0, v9: 0, v10: 0, v11: 0, v12: 0, v13: 0, v14: 0, v15: 0, v16: 0, v17: 0, v18: 0, v19: 0, v20: 0, v21: 0, v22: 0, v23: 0, v24: 0, v25: 0, v26: 0, v27: 0, v28: 0, v29: 0, v30: 0, v31: 0, v32: 0, v33: 0, v34: 0, v35: 0, v36: 0, v37: 0, v38: 0, v39: 0, v40: 0, v41: 0, v42: 0, v43: 0, v44: 0, v45: 0, v46: 0, v47: 0, v48: 0, v49: 0} )

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

  .constraint( 'v19, v20' )
  .method( 'v19 -> v20', right )
  .method( 'v20 -> v19', left )

  .constraint( 'v20, v21' )
  .method( 'v20 -> v21', right )
  .method( 'v21 -> v20', left )

  .constraint( 'v21, v22' )
  .method( 'v21 -> v22', right )
  .method( 'v22 -> v21', left )

  .constraint( 'v22, v23' )
  .method( 'v22 -> v23', right )
  .method( 'v23 -> v22', left )

  .constraint( 'v23, v24' )
  .method( 'v23 -> v24', right )
  .method( 'v24 -> v23', left )

  .constraint( 'v24, v25' )
  .method( 'v24 -> v25', right )
  .method( 'v25 -> v24', left )

  .constraint( 'v25, v26' )
  .method( 'v25 -> v26', right )
  .method( 'v26 -> v25', left )

  .constraint( 'v26, v27' )
  .method( 'v26 -> v27', right )
  .method( 'v27 -> v26', left )

  .constraint( 'v27, v28' )
  .method( 'v27 -> v28', right )
  .method( 'v28 -> v27', left )

  .constraint( 'v28, v29' )
  .method( 'v28 -> v29', right )
  .method( 'v29 -> v28', left )

  .constraint( 'v29, v30' )
  .method( 'v29 -> v30', right )
  .method( 'v30 -> v29', left )

  .constraint( 'v30, v31' )
  .method( 'v30 -> v31', right )
  .method( 'v31 -> v30', left )

  .constraint( 'v31, v32' )
  .method( 'v31 -> v32', right )
  .method( 'v32 -> v31', left )

  .constraint( 'v32, v33' )
  .method( 'v32 -> v33', right )
  .method( 'v33 -> v32', left )

  .constraint( 'v33, v34' )
  .method( 'v33 -> v34', right )
  .method( 'v34 -> v33', left )

  .constraint( 'v34, v35' )
  .method( 'v34 -> v35', right )
  .method( 'v35 -> v34', left )

  .constraint( 'v35, v36' )
  .method( 'v35 -> v36', right )
  .method( 'v36 -> v35', left )

  .constraint( 'v36, v37' )
  .method( 'v36 -> v37', right )
  .method( 'v37 -> v36', left )

  .constraint( 'v37, v38' )
  .method( 'v37 -> v38', right )
  .method( 'v38 -> v37', left )

  .constraint( 'v38, v39' )
  .method( 'v38 -> v39', right )
  .method( 'v39 -> v38', left )

  .constraint( 'v39, v40' )
  .method( 'v39 -> v40', right )
  .method( 'v40 -> v39', left )

  .constraint( 'v40, v41' )
  .method( 'v40 -> v41', right )
  .method( 'v41 -> v40', left )

  .constraint( 'v41, v42' )
  .method( 'v41 -> v42', right )
  .method( 'v42 -> v41', left )

  .constraint( 'v42, v43' )
  .method( 'v42 -> v43', right )
  .method( 'v43 -> v42', left )

  .constraint( 'v43, v44' )
  .method( 'v43 -> v44', right )
  .method( 'v44 -> v43', left )

  .constraint( 'v44, v45' )
  .method( 'v44 -> v45', right )
  .method( 'v45 -> v44', left )

  .constraint( 'v45, v46' )
  .method( 'v45 -> v46', right )
  .method( 'v46 -> v45', left )

  .constraint( 'v46, v47' )
  .method( 'v46 -> v47', right )
  .method( 'v47 -> v46', left )

  .constraint( 'v47, v48' )
  .method( 'v47 -> v48', right )
  .method( 'v48 -> v47', left )

  .constraint( 'v48, v49' )
  .method( 'v48 -> v49', right )
  .method( 'v49 -> v48', left )

  .end()

})();
