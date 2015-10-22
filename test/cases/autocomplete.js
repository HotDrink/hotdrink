
/*====================================================================
 * Implementation of autocomplete using ordinary
 */

function autocomplete( input ) {
  var table = document.getElementById( input.id + '-menu' );
  var query = '';
  var index = -1;
  var menu = [];
  var value = '';
  var timeout;

  $(input).keydown(
    function( e ) {
      if (e.keyCode == 38) {
        incIndex( -1 );
        e.preventDefault();
      }
      else if (e.keyCode == 40) {
        incIndex( 1 );
        e.preventDefault();
      }
      else if (e.keyCode == 13) {
        input.value = value;
        query = '';
        clearMenu();
        e.preventDefault();
      }
    }
  ).keyup(
    function( e ) {
      if (e.keyCode != 37 && e.keyCode != 38 &&
          e.keyCode != 39 && e.keyCode != 40 && e.keyCode != 13) {
        // if (timeout) {
        //   clearTimeout( timeout );
        // }
        // timeout = window.setTimeout( function() {
          setQuery( input.value );
        //   timeout = null;
        // }, 400 );
      }
    }
  );

  function setQuery( to ) {
    if (query == to) { return; }

    query = to;
    index = -1;
    value = query;

    // Initiate Ajax
    if (query) {
      $.ajax({
        type: 'GET',
        url: 'http://autocomplete.wunderground.com/aq',
        data: {
          'query': query
        },
        dataType: 'jsonp',
        jsonp: 'cb',
        crossDomain: true,
        success: function( response ) {
          // On success, update menu
          setMenu( response.RESULTS.map( function( city ) { return city.name; } ) )
        },
        error: ajaxError
      });
    }
    else {
      setMenu( [] );
    }
  }

  function setMenu( to ) {
    menu = to;
    clearMenu();
    for (var i = 0, l = menu.length; i < l; ++i) {
      var tr = table.insertRow( i );
      var td = tr.insertCell( 0 );
      $(td).mouseenter(
        function() {
          setIndex( this.parentElement.rowIndex )
        }
      ).click(
        function() {
          input.value = value;
          query = '';
          clearMenu();
        }
      )

      td.appendChild( document.createTextNode( menu[i] ) );
    }

    setIndex( 0 );
  }

  function clearMenu() {
    while (table.rows.length > 0) {
      table.deleteRow( 0 );
    }
  }

  function setIndex( to ) {
    index = to;
    if (index >= 0 && index < menu.length) {
      value = menu[index];
    }
    for (var i = 0, l = table.rows.length; i < l; ++i) {
      if (i == index) {
        var td = table.rows[i].firstElementChild;
        td.classList.add( 'on' );
        if (td.scrollIntoViewIfNeeded) {
          td.scrollIntoViewIfNeeded();
        }
        else {
          td.scrollIntoView();
        }
      }
      else {
        table.rows[i].firstElementChild.classList.remove( 'on' );
      }
    }
  }

  function incIndex( howmany ) {
    var to = index + howmany;
    if (to < -1) {
      to = -1;
    }
    if (to > menu.length) {
      to = menu.length;
    }
    setIndex( to );
  }
}
