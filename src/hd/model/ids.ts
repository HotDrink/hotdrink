module hd.model {

  import u = hd.utility;

  export var debugIds = true;

  var namespaces: u.Dictionary<string> = {};
  var namespaceCount = 0;

  export class IdGenerator {

    count: number;
    namespace: string;

    constructor( ns?: string ) {
      this.namespace = ns;
      if (ns && ! (ns in namespaces)) {
        namespaces[ns] = <any>++namespaceCount;
      }
      this.count = 0;
    }

    makeId( name: string ) {
      var pieces: string[] = [];
      if (debugIds) {
        pieces.push( name );
      }
      pieces.push( '#' );
      if (this.namespace) {
        if (debugIds) {
          pieces.push( this.namespace, '.' );
        }
        else {
          pieces.push( namespaces[this.namespace], '.' );
        }
      }
      pieces.push( <any>++this.count );
      return pieces.join( '' );
    }


  }

}