(function() {

function right( x ) {
  return x + 1;
}

function left( x ) {
  return x - 1;
}

model = new hd.ModelBuilder()
  .variables( {v0: 0, v1: 0, v2: 0, v3: 0, v4: 0, v5: 0, v6: 0, v7: 0, v8: 0, v9: 0, v10: 0, v11: 0, v12: 0, v13: 0, v14: 0, v15: 0, v16: 0, v17: 0, v18: 0, v19: 0, v20: 0, v21: 0, v22: 0, v23: 0, v24: 0, v25: 0, v26: 0, v27: 0, v28: 0, v29: 0, v30: 0, v31: 0, v32: 0, v33: 0, v34: 0, v35: 0, v36: 0, v37: 0, v38: 0, v39: 0, v40: 0, v41: 0, v42: 0, v43: 0, v44: 0, v45: 0, v46: 0, v47: 0, v48: 0, v49: 0, v50: 0, v51: 0, v52: 0, v53: 0, v54: 0, v55: 0, v56: 0, v57: 0, v58: 0, v59: 0, v60: 0, v61: 0, v62: 0, v63: 0, v64: 0, v65: 0, v66: 0, v67: 0, v68: 0, v69: 0, v70: 0, v71: 0, v72: 0, v73: 0, v74: 0, v75: 0, v76: 0, v77: 0, v78: 0, v79: 0, v80: 0, v81: 0, v82: 0, v83: 0, v84: 0, v85: 0, v86: 0, v87: 0, v88: 0, v89: 0, v90: 0, v91: 0, v92: 0, v93: 0, v94: 0, v95: 0, v96: 0, v97: 0, v98: 0, v99: 0} )

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

  .constraint( 'v49, v50' )
  .method( 'v49 -> v50', right )
  .method( 'v50 -> v49', left )

  .constraint( 'v50, v51' )
  .method( 'v50 -> v51', right )
  .method( 'v51 -> v50', left )

  .constraint( 'v51, v52' )
  .method( 'v51 -> v52', right )
  .method( 'v52 -> v51', left )

  .constraint( 'v52, v53' )
  .method( 'v52 -> v53', right )
  .method( 'v53 -> v52', left )

  .constraint( 'v53, v54' )
  .method( 'v53 -> v54', right )
  .method( 'v54 -> v53', left )

  .constraint( 'v54, v55' )
  .method( 'v54 -> v55', right )
  .method( 'v55 -> v54', left )

  .constraint( 'v55, v56' )
  .method( 'v55 -> v56', right )
  .method( 'v56 -> v55', left )

  .constraint( 'v56, v57' )
  .method( 'v56 -> v57', right )
  .method( 'v57 -> v56', left )

  .constraint( 'v57, v58' )
  .method( 'v57 -> v58', right )
  .method( 'v58 -> v57', left )

  .constraint( 'v58, v59' )
  .method( 'v58 -> v59', right )
  .method( 'v59 -> v58', left )

  .constraint( 'v59, v60' )
  .method( 'v59 -> v60', right )
  .method( 'v60 -> v59', left )

  .constraint( 'v60, v61' )
  .method( 'v60 -> v61', right )
  .method( 'v61 -> v60', left )

  .constraint( 'v61, v62' )
  .method( 'v61 -> v62', right )
  .method( 'v62 -> v61', left )

  .constraint( 'v62, v63' )
  .method( 'v62 -> v63', right )
  .method( 'v63 -> v62', left )

  .constraint( 'v63, v64' )
  .method( 'v63 -> v64', right )
  .method( 'v64 -> v63', left )

  .constraint( 'v64, v65' )
  .method( 'v64 -> v65', right )
  .method( 'v65 -> v64', left )

  .constraint( 'v65, v66' )
  .method( 'v65 -> v66', right )
  .method( 'v66 -> v65', left )

  .constraint( 'v66, v67' )
  .method( 'v66 -> v67', right )
  .method( 'v67 -> v66', left )

  .constraint( 'v67, v68' )
  .method( 'v67 -> v68', right )
  .method( 'v68 -> v67', left )

  .constraint( 'v68, v69' )
  .method( 'v68 -> v69', right )
  .method( 'v69 -> v68', left )

  .constraint( 'v69, v70' )
  .method( 'v69 -> v70', right )
  .method( 'v70 -> v69', left )

  .constraint( 'v70, v71' )
  .method( 'v70 -> v71', right )
  .method( 'v71 -> v70', left )

  .constraint( 'v71, v72' )
  .method( 'v71 -> v72', right )
  .method( 'v72 -> v71', left )

  .constraint( 'v72, v73' )
  .method( 'v72 -> v73', right )
  .method( 'v73 -> v72', left )

  .constraint( 'v73, v74' )
  .method( 'v73 -> v74', right )
  .method( 'v74 -> v73', left )

  .constraint( 'v74, v75' )
  .method( 'v74 -> v75', right )
  .method( 'v75 -> v74', left )

  .constraint( 'v75, v76' )
  .method( 'v75 -> v76', right )
  .method( 'v76 -> v75', left )

  .constraint( 'v76, v77' )
  .method( 'v76 -> v77', right )
  .method( 'v77 -> v76', left )

  .constraint( 'v77, v78' )
  .method( 'v77 -> v78', right )
  .method( 'v78 -> v77', left )

  .constraint( 'v78, v79' )
  .method( 'v78 -> v79', right )
  .method( 'v79 -> v78', left )

  .constraint( 'v79, v80' )
  .method( 'v79 -> v80', right )
  .method( 'v80 -> v79', left )

  .constraint( 'v80, v81' )
  .method( 'v80 -> v81', right )
  .method( 'v81 -> v80', left )

  .constraint( 'v81, v82' )
  .method( 'v81 -> v82', right )
  .method( 'v82 -> v81', left )

  .constraint( 'v82, v83' )
  .method( 'v82 -> v83', right )
  .method( 'v83 -> v82', left )

  .constraint( 'v83, v84' )
  .method( 'v83 -> v84', right )
  .method( 'v84 -> v83', left )

  .constraint( 'v84, v85' )
  .method( 'v84 -> v85', right )
  .method( 'v85 -> v84', left )

  .constraint( 'v85, v86' )
  .method( 'v85 -> v86', right )
  .method( 'v86 -> v85', left )

  .constraint( 'v86, v87' )
  .method( 'v86 -> v87', right )
  .method( 'v87 -> v86', left )

  .constraint( 'v87, v88' )
  .method( 'v87 -> v88', right )
  .method( 'v88 -> v87', left )

  .constraint( 'v88, v89' )
  .method( 'v88 -> v89', right )
  .method( 'v89 -> v88', left )

  .constraint( 'v89, v90' )
  .method( 'v89 -> v90', right )
  .method( 'v90 -> v89', left )

  .constraint( 'v90, v91' )
  .method( 'v90 -> v91', right )
  .method( 'v91 -> v90', left )

  .constraint( 'v91, v92' )
  .method( 'v91 -> v92', right )
  .method( 'v92 -> v91', left )

  .constraint( 'v92, v93' )
  .method( 'v92 -> v93', right )
  .method( 'v93 -> v92', left )

  .constraint( 'v93, v94' )
  .method( 'v93 -> v94', right )
  .method( 'v94 -> v93', left )

  .constraint( 'v94, v95' )
  .method( 'v94 -> v95', right )
  .method( 'v95 -> v94', left )

  .constraint( 'v95, v96' )
  .method( 'v95 -> v96', right )
  .method( 'v96 -> v95', left )

  .constraint( 'v96, v97' )
  .method( 'v96 -> v97', right )
  .method( 'v97 -> v96', left )

  .constraint( 'v97, v98' )
  .method( 'v97 -> v98', right )
  .method( 'v98 -> v97', left )

  .constraint( 'v98, v99' )
  .method( 'v98 -> v99', right )
  .method( 'v99 -> v98', left )

  .end()

})();
