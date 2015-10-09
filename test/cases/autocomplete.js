
/*====================================================================
 */

function AutoComplete( id ) {
  this.queryInput = document.getElementById( id );
  this.menuTable = document.getElementById( id + '-menu' );
  this.index = -1;
  this.menu = [];
  this.value = '';

  var thisObj = this;
  var timeout;
  $(this.queryInput).keydown(
    function( e ) {
      if (e.keyCode == 38) {
        thisObj.incIndex( -1 );
        e.preventDefault();
      }
      else if (e.keyCode == 40) {
        thisObj.incIndex( 1 );
        e.preventDefault();
      }
      else if (e.keyCode == 13) {
        thisObj.queryInput.value = thisObj.value;
        thisObj.setQuery( '' );
        e.preventDefault();
      }
    }
  ).keyup(
    function( e ) {
      if (e.keyCode != 38 && e.keyCode != 40 && e.keyCode != 13) {
        if (timeout) {
          window.clearTimeout( timeout );
        }
        var value = thisObj.queryInput.value;
        timeout = window.setTimeout( function() {
          thisObj.setQuery( value );
          timeout = null;
        }, 400 );
      }
    }
  );
}

/*--------------------------------------------------------------------
 */
AutoComplete.prototype.setQuery = function( query ) {
  if (this.query == query) { return; }

  // Update variables
  this.query = query;
  this.index = -1;
  this.value = query;

  // Initiate Ajax
  if (query) {
    var thisObj = this;
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
        thisObj.setMenu( response.RESULTS.map( function( city ) { return city.name; } ) )
      },
      error: ajaxError
    });
  }
  else {
    this.setMenu( [] );
  }
}

/*--------------------------------------------------------------------
 */
AutoComplete.prototype.setMenu = function( menu ) {
  this.menu = menu;
  while (this.menuTable.rows.length > 0) {
    this.menuTable.deleteRow( 0 );
  }
  for (var i = 0, l = menu.length; i < l; ++i) {
    var tr = this.menuTable.insertRow( i );
    var td = tr.insertCell( 0 );
    var thisObj = this;
    $(td).mouseenter( function() {
      thisObj.setIndex( this.parentElement.rowIndex )
    } ).click( function() {
      thisObj.queryInput.value = thisObj.value;
      thisObj.setQuery( '' );
    } )

    td.appendChild( document.createTextNode( menu[i] ) );
  }
}

/*--------------------------------------------------------------------
 */
AutoComplete.prototype.setIndex = function( index ) {
  this.index = index;
  this.value = this.menu[index];
  for (var i = 0, l = this.menuTable.rows.length; i < l; ++i) {
    if (i == index) {
      this.menuTable.rows[i].firstElementChild.classList.add( 'on' );
    }
    else {
      this.menuTable.rows[i].firstElementChild.classList.remove( 'on' );
    }
  }
}

/*----------------------------------------------------------------
 */
AutoComplete.prototype.incIndex = function( howmany ) {
  var index = this.index + howmany;
  if (index < 0) {
    index = 0;
  }
  if (index >= this.menu.length) {
    index = this.menu.length - 1;
  }
  this.setIndex( index );
  var td = this.menuTable.rows[index].cells[0];
  if (td.scrollIntoViewIfNeeded) {
    td.scrollIntoViewIfNeeded();
  }
  else {
    td.scrollIntoView();
  }
}


/*====================================================================
 * Error-handling function for Ajax call
 */
function ajaxError( jqXHR, status, error ) {
  alert( status );
  console.error( status, error );
}

/*====================================================================
 */

var HdAutoComplete;

$(function() {

  var autoCompleteSpec = new hd.ContextBuilder()
      .vs( 'query, menu, index, value' )

      .c( 'query, menu' )
      .m( 'query -> menu',
          function( query ) {
            var p = new hd.Promise();

            // Initiate Ajax
            if (query) {
              var thisObj = this;
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
                  p.resolve( response.RESULTS.map(
                    function( city ) { return city.name; }
                  ) )
                },
                error: ajaxError
              });
            }
            else {
              p.resolve( [] );
            }

            return p;
          } )

      .c( 'query => query, menu, index, value' )
      .m( 'query, menu, index -> value',
          function( query, menu, index) {
            if (index >= 0 && index < menu.length) {
              return menu[index];
            }
            else {
              return query
            }
          } )

      .c( 'query => menu, index' )
      .m( '!value, menu -> index',
          function( value, menu ) {
            return menu.indexOf( value );
          } )

      .cmd( 'inc', '!index, !menu -> index',
            function( i, m ) {
              return i < m.length ? i + 1 : m.length;
            } )
      .cmd( 'dec', '!index -> index',
            function( i ) {
              return i >= 0 ? i - 1 : -1;
            } )

      .spec();


  HdAutoComplete = function HdAutoComplete() {
    hd.Context.call( this, autoCompleteSpec );
  };

  HdAutoComplete.prototype = Object.create( hd.Context.prototype );
});

/*====================================================================
 */

function AutocompleteMenu( input ) {
  var table = document.getElementById( input.id + '-menu');

  var inc = new hd.BasicObservable();
  this.inc = inc;
  var dec = new hd.BasicObservable();
  this.dec = dec;
  var showing = false;

  input.addEventListener( 'keydown', function( e ) {
    if (showing) {
      if (e.keyCode == 38) {
        dec.sendNext( e );
        e.preventDefault();
      }
      if (e.keyCode == 40) {
        inc.sendNext( e );
        e.preventDefault();
      }
    }
  } );

  input.addEventListener( 'change', function( e ) {
    showing = false;
    while (table.rows.length > 0) {
      table.deleteRow( 0 );
    }
  } );

  table.addEventListener( 'mouseleave', function() {
    hover.sendNext( -1 );
  } );

  // Observable for last row with mouseover
  var hover = new hd.BasicObservable();
  this.hover = hover;

  this.clear = {
    onNext: function() {
      while (table.rows.length > 0) {
        table.deleteRow( 0 );
      }
    }
  }

  // Observer for menu items
  this.items = {
    onNext: function( items ) {
      showing = true;
      while (table.rows.length > 0) {
        table.deleteRow( 0 );
      }
      for (var i = 0, l = items.length; i < l; ++i) {
        var tr = table.insertRow( i );
        var td = tr.insertCell( 0 );
        td.addEventListener( 'mouseenter', function() {
          hover.sendNext( this.parentElement.rowIndex );
        } );
        td.addEventListener( 'click', function() {
          input.dispatchEvent( new Event( 'change', {bubbles: true, cancelable: false} ) );
        } )
        td.appendChild( document.createTextNode( items[i] ) );
      }
    },
  };

    // Observer for index
  this.highlight = {
    onNext: function( index ) {
      if (showing) {
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
    },
  };
}


/*====================================================================
 */

function hdAutoComplete( el, ac ) {
  var menu = new AutocompleteMenu( el );

  return [
    {view: new hd.Edit( el ),
     toModel: hd.stabilize(),
     model: hd.rw( ac.value, ac.query )},

    {view: menu.items,
     model: ac.menu},

    {view: menu.highlight,
     model: ac.index},

    {view: menu.hover,
     model: ac.index},

    {view: menu.dec,
     model: ac.dec},

    {view: menu.inc,
     model: ac.inc},
  ];
}
