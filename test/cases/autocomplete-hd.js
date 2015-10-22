
/*====================================================================
 * Function for Ajax calls
 */

function getMenu( query, cb ) {
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
      // On success, invoke callback
      cb( response.RESULTS.map(
        function( city ) { return city.name; }
      ) )
    },
    error: ajaxError
  });
}

function ajaxError( jqXHR, status, error ) {
  alert( status );
  console.error( status, error );
}

/*====================================================================
 * HotDrink model
 */

var HdAutoComplete;

$(function() {

  var autoCompleteSpec = new hd.ComponentBuilder()
      // Variables
      .vs( 'query, menu, index, value' )

      // Calculate menu
      .c( 'query, menu' )
      .m( 'query -> menu',
          function( query ) {
            var p = new hd.Promise();

            // Initiate Ajax
            if (query) {
              getMenu( query, function( menu ) { p.resolve( menu ); } );
            }
            else {
              p.resolve( [] );
            }

            return p;
          } )

      // Calculate value
      .c( 'query, menu, index, value' )
      .m( 'query, menu, index -> value',
          function( query, menu, index) {
            if (index >= 0 && index < menu.length) {
              return menu[index];
            }
            else {
              return query
            }
          } )

      // After writing to query, calculate index
      .c( 'query => menu, index' )
      .m( '!value, menu -> index',
          function( value, menu ) {
            var i = menu.indexOf( value );
            return i < 0 ? 0 : i;
          } )

      // Increment index
      .cmd( 'inc', '!index, !menu -> index',
            function( i, m ) {
              return i < m.length ? i + 1 : m.length;
            } )

      // Decrement index
      .cmd( 'dec', '!index -> index',
            function( i ) {
              return i >= 0 ? i - 1 : -1;
            } )

      .spec();


  //------------------------------------------------------------------
  // Make a JavaScript type for this spec.

  HdAutoComplete = function HdAutoComplete() {
    hd.Component.call( this, autoCompleteSpec );
  };

  HdAutoComplete.prototype = Object.create( hd.Component.prototype );
});

/*====================================================================
 * View adapter for autocomplete menu -- a container for several
 * different observables and observers
 */

function AutoCompleteMenu( input ) {
  var table = document.getElementById( input.id + '-menu');
  var menuVisible = false;
  var menuEnabled = true;

  // Extra logic: hide menu when input finalized
  input.addEventListener( 'change', function( e ) {
    menuVisible = false;
    while (table.rows.length > 0) {
      table.deleteRow( 0 );
    }
  } );

  // Observables for increment and decrement command
  var inc = this.inc = new hd.BasicObservable();
  var dec = this.dec = new hd.BasicObservable();

  input.addEventListener( 'keydown', function( e ) {
    if (menuVisible) {
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
  input.addEventListener( 'input', function() {
    menuVisible = true;
  } );

  // Observable for mouse over row
  var hover = new hd.BasicObservable();
  this.hover = hover;

  table.addEventListener( 'mouseleave', function() {
    hover.sendNext( -1 );
  } );

  this.disabled = {
    onNext: function( disable ) {
      if (disable == menuEnabled) {
        if (disable) {
          table.classList.add( 'disabled' );
        }
        else {
          table.classList.remove( 'disabled' );
        }
        menuEnabled = !disable;
      }
    }
  }

  // Observer for menu items
  this.items = {
    onNext: function( items ) {
      if (! menuVisible) { return }
      while (table.rows.length > 0) {
        table.deleteRow( 0 );
      }
      for (var i = 0, l = items.length; i < l; ++i) {
        var tr = table.insertRow( i );
        var td = tr.insertCell( 0 );
        td.addEventListener( 'mouseenter', function() {
          if (menuEnabled) {
            hover.sendNext( this.parentElement.rowIndex );
          }
        } );
        td.addEventListener( 'click', function() {
          if (menuEnabled) {
            input.dispatchEvent( new Event( 'change', {bubbles: true, cancelable: false} ) );
          }
        } )
        td.appendChild( document.createTextNode( items[i] ) );
      }
    },
  };

    // Observer for selected index
  this.highlight = {
    onNext: function( index ) {
      if (menuVisible) {
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
 * Create binding for HdAutoComplete -- connect observables and
 * observers
 */

hd.bind.BindEnvironment.prototype.autocomplete =
  function autocomplete( ac ) {
    var menu = new AutoCompleteMenu( this.el );

    return [
      // The input element: read value, write query
      {view:    new hd.Edit( this.el ),
       //toModel: this.stabilize(),
       model:   this.rw( ac.value, ac.query ),
       dir:     hd.Direction.bi},

      // Menu items
      {view:  menu.items,
       model: ac.menu,
       dir:   hd.Direction.m2v},

      // Menu disabled while pending
      {view:  menu.disabled,
       model: ac.menu.pending,
       dir:   hd.Direction.m2v},

      // Index to highlight
      {view:  menu.highlight,
       model: ac.index,
       dir:   hd.Direction.m2v},

      // Index being hovered
      {view:  menu.hover,
       model: ac.index,
       dir:   hd.Direction.v2m},

      // Decrement command
      {view:  menu.dec,
       model: ac.dec,
       dir:   hd.Direction.v2m},

      // Increment command
      {view:  menu.inc,
       model: ac.inc,
       dir:   hd.Direction.v2m},
    ];
  }
