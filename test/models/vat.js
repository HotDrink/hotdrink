(function() {

function product( a, b ) { return a*b; }
function quotient( a, b ) { return b == 0 ? 0 : a/b; }
function sum( a, b ) { return a + b; }
function difference( a, b ) { return a - b; }

model = new hd.ModelBuilder()
  .variables( {pprice: 0, prate: 0, ptax: 0,
               sprice: 0, srate: 0, stax: 0, diff: 0} )

  .constraint( 'pprice, prate, ptax' )
  .method( 'pprice, prate -> ptax', product )
  .method( 'ptax, pprice -> prate', quotient )
  .method( 'ptax, prate -> pprice', quotient )

  .constraint( 'sprice, srate, stax' )
  .method( 'sprice, srate -> stax', product )
  .method( 'stax, sprice -> srate', quotient )
  .method( 'stax, srate -> sprice', quotient )

  .constraint( 'ptax, stax, diff' )
  .method( 'ptax, diff -> stax', sum )
  .method( 'stax, ptax -> diff', difference )
  .method( 'stax, diff -> ptax', difference )

  .end()

})();
