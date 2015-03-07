module hd.model {

  import u = hd.utility;

  export var debugIds = true;

  var count = 0;

  export function makeId( name: string ) {
    var pieces: string[] = [];
    if (debugIds) {
      pieces.push( name );
    }
    pieces.push( '#' );
    pieces.push( <any>++count );
    return pieces.join( '' );
  }

}