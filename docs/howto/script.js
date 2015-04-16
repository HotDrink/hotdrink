window.addEventListener( 'load', function() {
  var labels = document.getElementsByClassName( 'org-src-name' );
  for (var i = 0, l = labels.length; i < l; ++i) {
    initSource( labels[i], i );
  }
} )

function initSource( label, i ) {
  var source = label.nextElementSibling;
  source.style.display = 'none';
  label.style.marginBottom = '1.2em';
  var a = document.createElement( 'a' );
  a.name = 'src' + i;
  a.href = 'javascript:null';
  a.appendChild( document.createTextNode( 'show' ) );
  a.onclick = function() {
    if (source.style.display == 'none') {
      source.style.display = 'inherit';
      label.removeAttribute( 'style' );
      a.removeChild( a.lastChild );
      a.appendChild( document.createTextNode( 'hide' ) );
    }
    else {
      source.style.display = 'none';
      label.style.marginBottom = '1.2em';
      a.removeChild( a.lastChild );
      a.appendChild( document.createTextNode( 'show' ) );
    }
  };
  var span = document.createElement( 'small' );
  span.appendChild( document.createTextNode( '  (' ) );
  span.appendChild( a );
  span.appendChild( document.createTextNode( ')' ) );
  label.appendChild( span );
}

// window.addEventListener( 'load', function() {
//   var sources = document.getElementsByClassName( 'org-src-container' );
//   for (var i = 0, l = sources.length; i < l; ++i) {
//     initSource( sources[i], i );
//   }
// } )

// function initSource( source, i ) {
//   source.style.display = 'none';
//   var a = document.createElement( 'a' );
//   a.name = 'src' + i;
//   a.href = '#src' + i;
//   a.appendChild( document.createTextNode( 'show' ) );
//   a.onclick = function() {
//     if (source.style.display == 'none') {
//       source.style.display = 'inherit';
//       a.removeChild( a.lastChild );
//       a.appendChild( document.createTextNode( 'hide' ) );
//     }
//     else {
//       source.style.display = 'none';
//       a.removeChild( a.lastChild );
//       a.appendChild( document.createTextNode( 'show' ) );
//     }
//   };
//   var span = document.createElement( 'span' );
//   span.appendChild( document.createTextNode( ' (' ) );
//   span.appendChild( a );
//   span.appendChild( document.createTextNode( ')' ) );
//   source.previousElementSibling.appendChild( span );
// }
