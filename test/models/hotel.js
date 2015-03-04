(function() {

function  sum( x, y ) { return x + y }
function diff( x, y ) { return x - y }
function copy( x ) { return x }

model = new hd.ModelBuilder()
  .variables( {checkin: 0, checkout: 4, nights: undefined, rate: 100,
               cost: undefined, max: undefined, fromnow: undefined}
            )

  .constraint( 'fromnow, checkin' )
  .method( 'fromnow -> checkin', copy )
  .method( 'checkin -> fromnow', copy )

  .constraint( 'checkin, checkout, nights' )
  .method( 'checkout, checkin -> nights', diff )
  .method( 'checkout, nights -> checkin', diff )
  .method( 'checkin, nights -> checkout', sum  )

  .constraint( 'nights, rate, cost, max' )
  .method( 'nights, rate -> cost, max', function( n, r ) {
    return [n*r, n*r];
  } )
  .method( 'max, nights -> rate, cost', function( m, n ) {
    var r = Math.floor( m/n );
    return [r, n*r];
  } )
  .method( 'max, rate -> nights, cost', function( m, r ) {
    var n = Math.floor( m/r );
    return [n, n*r];
  } )

  .end()

})();
