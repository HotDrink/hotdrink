
model = new hd.ModelBuilder()
  .variables( {w: 60, h: 40, a: undefined, p: undefined} )

  .constraint( 'w, h, a' )
  .method( 'w, h -> a',
           function( w, h ) {
             return w * h;
           }
         )
  .method( 'a, w -> h',
           function( a, w ) {
             return a / w;
           }
         )
  .method( 'a, h -> w',
           function( a, h ) {
             return a / h;
           }
         )

  .constraint( 'w, h, p' )
  .method( 'w, h -> p',
           function( w, h ) {
             return 2*(w+h);
           }
         )
  .method( 'p, w -> h',
           function( p, w ) {
             return p/2 - w;
           }
         )
  .method( 'p, h -> w',
           function( p, h ) {
             return p/2 - h;
           }
         )

  .end()
