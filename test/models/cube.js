
model = new hd.ModelBuilder()
  .variables( {width: 10, height: 10, depth: 10, surface: undefined, volume: undefined} )

  .constraint( 'width, height, depth, surface' )
  .method( 'width, height, depth -> surface',
           function( width, height, depth ) {
             return 2 * width * height + 2 * width * depth + 2 * height * depth;
           }
         )
  .method( 'surface, width, height -> depth',
           function( surface, width, height ) {
             return (surface - 2 * width * height)/2/(width + height);
           }
         )
  .method( 'surface, width, depth -> height',
           function( surface, width, depth ) {
             return (surface - 2 * width * depth)/2/(width + depth);
           }
         )
  .method( 'surface, depth, height -> width',
           function( surface, depth, height ) {
             return (surface - 2 * depth * height)/2/(depth + height);
           }
         )

  .constraint( 'width, height, depth, volume' )
  .method( 'width, height, depth -> volume',
           function( width, height, depth ) {
             return width*height*depth;
           }
         )
  .method( 'volume, width, height -> depth',
           function( volume, width, height ) {
             return volume/width/height;
           }
         )
  .method( 'volume, width, depth -> height',
           function( volume, width, depth ) {
             return volume/width/depth;
           }
         )
  .method( 'volume, depth, height -> width',
           function( volume, depth, height ) {
             return volume/depth/height;
           }
         )

  .end()
