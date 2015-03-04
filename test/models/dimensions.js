
model = new hd.ModelBuilder()
  .variables( {left: 0, top: 0, right: undefined, bottom: undefined,
               width: 200, height: 200, aspect: undefined} )

  .constraint( 'left, right, width' )
  .method( 'right, width -> left',
           function( right, width ) {
             return right - width;
           }
         )
  .method( 'left, width -> right',
           function( left, width ) {
             return left + width;
           }
         )
  .method( 'left, right -> width',
           function( left, right ) {
             return right - left;
           }
         )

  .constraint( 'top, bottom, height' )
  .method( 'bottom, height -> top',
           function( bottom, height ) {
             return bottom - height;
           }
         )
  .method( 'top, height -> bottom',
           function( top, height ) {
             return top + height;
           }
         )
  .method( 'top, bottom -> height',
           function( top, bottom ) {
             return bottom - top;
           }
         )

  .constraint( 'height, width, aspect' )
  .method( 'height, aspect -> width',
           function( height, aspect ) {
             return height * aspect;
           }
         )
  .method( 'width, aspect -> height',
           function( width, aspect ) {
             return width / aspect;
           }
         )
  .method( 'width, height -> aspect',
                   function( width, height ) {
                     return width / height;
                   }
         )

  .end()
