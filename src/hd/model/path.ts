/*####################################################################
 * The Path class
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  // A position in a template; null for 0 dimensions, number for 1
  export
  type Position = number;

  /*==================================================================
   * Pattern for an array index in a path
   */
  export
  class IndexPattern {
    scale: number;
    offset: number;

    // Init
    constructor( scale: number, offset: number ) {
      this.scale = scale;
      this.offset = offset;
    }

    // Get the result for this pattern at a particular position
    apply( pos: Position ): Position {
      if (this.scale == 0) {
        return this.offset;
      }
      else if (pos === null) {
        return pos;
      }
      else {
        return this.scale * pos + this.offset;
      }
    }

    // Inverse of apply: what value of index variable would
    //   result in the value for that variable in given position?
    inverse( pos: Position ): Position {
      if (this.scale == 0) { return this.offset; }
      if (pos === null) { return null; }
      var i = (pos - this.offset) / this.scale;
      if (Math.floor( i ) === i) {
        return i;
      }
      else {
        return null;
      }
    }
  }

  /*==================================================================
   * Defines names of index variable
   */

  // index variable names, in order
  var indexName: string;

  // define names for array indices
  function defineArrayIndexName( name: string ) {
    indexName = name;
  }

  // Default: i, j, k
  defineArrayIndexName( 'i' );

  class PropertyObserver {
    constructor( public path: Path,
                 public property: r.Signal<any>,
                 public legi: number,
                 public pos: Position          ) {
      property.addObserverChangesOnly( this );
    }

    destruct() {
      this.property.removeObserver( this );
    }

    onNext() {
      this.path.onNextProperty( this.legi, this.pos );
    }

    onError() { }
    onCompleted() { }
  }

  class ArrayObserver {
    constructor( public path: Path,
                 public ctx: ArrayContext,
                 public legi: number,
                 public pos: Position      ) {
      ctx.changes.addObserver( this );
    }

    destruct() {
      this.ctx.changes.removeObserver( this );
    }

    onNext( idx: number ) {
      this.path.onNextArray( idx, this.legi, this.pos );
    }

    onError() { }
    onCompleted() { }
  }

  type LegObserver = PropertyObserver | ArrayObserver;

  /*==================================================================
   * An observable representing a particular property path in a
   * context.
   */
  export
  class Path extends r.BasicObservable<any> {

    // The context at which to begin the search
    start: Context;

    // The property path to follow
    legs: (string|IndexPattern)[];

    // Maximum index variable used
    cardinality: number;

    constant = true;

    private branchi = 0;

    // Any observable properties subscribed to along the way
    private observers0: LegObserver[] = null;
    private observers1: LegObserver[][] = null;

    private result: any;

    /*----------------------------------------------------------------
     * Perform initial search.
     */
    constructor( start: Context, path: string ) {
      super();

      // Break path down into property names and index patterns
      this.legs = parse( path );
      if (this.legs) {
        this.start = start;
        this.cardinality = 0;
        for (var i = 0, l = this.legs.length; i < l; ++i) {
          if ((<any>this.legs[i]) instanceof IndexPattern &&
              (<IndexPattern>this.legs[i]).scale != 0       ) {
            this.branchi = i;
            this.cardinality = 1;
            this.result = [];
            break;
          }
        }
      }
      else {
        // Create a path which always just returns undefined
        this.start = undefined;
        this.legs = [];
        this.cardinality = 0;
      }

      // Initialize
      this.followPath( this.start, 0, null );
    }

    /*----------------------------------------------------------------
     * The current result for the path serach
     */
    get( pos: Position ): any {
      if (this.cardinality == 0) {
        return this.result;
      }
      else if (pos !== null) {
        return this.result[pos]
      }
    }

    private
    addResult( pos: Position, val: any ) {
      if (this.cardinality == 0) {
        this.result = val;
        this.sendNext( null );
      }
      else if (pos !== null) {
        this.result[pos] = val;
        this.sendNext( pos );
      }
    }

    private
    dropResult( pos: Position ) {
      if (this.cardinality == 0) {
        if (this.result !== undefined) {
          this.result = undefined;
          this.sendNext( pos );
        }
      }
      else if (pos !== null) {
        if (this.result[pos] !== undefined) {
          this.result[pos] = undefined;
          this.sendNext( pos );
        }
      }
      else {
        this.result = [];
        this.sendNext( pos );
      }
    }

    private
    getUpTo( limit: number, pos: Position ): any {
      var ctx = this.start;
      for (var legi = 0; legi < limit && ctx instanceof Context; ++legi) {
        var leg = this.legs[legi];
        if (typeof leg === 'string') {
          ctx = ctx[leg];
        }
        else if (leg instanceof IndexPattern) {
          var n = leg.apply( pos );
          if (n === null) {
            ctx = undefined;
          }
          else {
            ctx = ctx[n];
          }
        }
      }
      return legi == limit ? ctx : undefined;
    }

    /*----------------------------------------------------------------
     */
    private
    addLegObserver( ver: LegObserver, legi: number, pos: Position ) {
      this.constant = false;
      if (pos === null) {
        if (! this.observers0) { this.observers0 = []; }
        this.observers0[legi] = ver;
      }
      else {
        if (! this.observers1) { this.observers1 = []; }
        if (! this.observers1[pos]) { this.observers1[pos] = []; }
        this.observers1[pos][legi - this.branchi] = ver;
      }
    }

    /*----------------------------------------------------------------
     */
    private
    removeLegObservers( start: number, pos: Position ) {
      if (pos === null) {
        if (this.observers0) {
          for (var i = start, l = this.observers0.length; i < l; ++i) {
            var ver = this.observers0[i]
            if (ver) {
              ver.destruct();
              this.observers0[i] = undefined;
            }
          }
        }
        if (this.observers1) {
          for (var i = 0, l = this.observers1.length; i < l; ++i) {
            var obs1 = this.observers1[i];
            if (obs1) {
              for (var j = 0, m = obs1.length; j < m; ++j) {
                var ver = obs1[j];
                if (ver) {
                  ver.destruct();
                  obs1[j] = undefined;
                }
              }
            }
          }
        }
      }
      else if (this.observers1) {
        var obs1 = this.observers1[pos];
        if (obs1) {
          for (var j = start - this.branchi, m = obs1.length; j < m; ++j) {
            var ver = obs1[j];
            if (ver) {
              ver.destruct();
              obs1[j] = undefined;
            }
          }
        }
      }
    }

    /*----------------------------------------------------------------
     * Perform the search, subscribing to any properties encountered.
     */
    private
    followPath( ctx: Context, legi: number, pos: Position ) {

      for (var l = this.legs.length; legi < l && ctx instanceof Context; ++legi) {
        var leg = this.legs[legi];
        if (typeof leg === 'string') {
          var propname = '$' + leg;
          if (propname in ctx) {
            var prop = ctx[propname];
            this.addLegObserver( new PropertyObserver( this, prop, legi, pos ), legi, pos );
            ctx = prop.get();
          }
          else {
            ctx = ctx[leg];
          }
        }
        else if (leg instanceof IndexPattern && ctx instanceof ArrayContext) {
          if (leg.scale == 0 || pos !== null) {
            var idx = leg.apply( pos );
            this.addLegObserver( new ArrayObserver( this, <ArrayContext>ctx, legi, pos ),
                                 legi, pos                                                );
            ctx = ctx[idx];
          }
          else {
            this.branchi = legi;
            this.addLegObserver( new ArrayObserver( this, <ArrayContext>ctx, legi, pos ),
                                 legi, pos                                                );
            for (var j = 0, m = (<ArrayContext>ctx).length; j < m; ++j) {
              if (ctx[j] !== undefined) {
                var n = leg.inverse( j );
                if (n !== null) {
                  this.followPath( ctx[j], legi + 1, n );
                }
              }
            }
            break; // we followed everything else recursively
          }
        }
      }
      if (l == legi && ctx !== undefined) {
        this.addResult( pos, ctx );
      }
    }

    /*----------------------------------------------------------------
     */
    onNextProperty( legi: number, pos: Position ) {
      this.dropResult( pos );
      this.removeLegObservers( legi + 1, pos );
      this.followPath( this.getUpTo( legi + 1, pos ), legi + 1, pos );
    }

    /*----------------------------------------------------------------
     */

    onNextArray( idx: number, legi: number, pos: Position ) {
      var leg = <IndexPattern>this.legs[legi];
      if (leg.scale == 0 || pos !== null) {
        var n = leg.inverse( pos );
        if (n === idx) {
          this.dropResult( pos );
          this.removeLegObservers( legi + 1, pos );
          this.followPath( this.getUpTo( legi + 1, pos ), legi + 1, pos );
        }
      }
      else {
        var pos = leg.apply( idx );
        this.dropResult( pos );
        this.removeLegObservers( legi + 1, pos );
        this.followPath( this.getUpTo( legi + 1, pos ), legi + 1, pos );
      }
    }
  }

  /*==================================================================
   */

  export
  function parse( pathstr: string ): (string|IndexPattern)[] {
    var s = pathstr;
    var nonempty = /\S/;
    var field = /^\s*\.?([a-zA-Z][\w$]*)/;
    var cindex = /^\s*\[\s*(\d+)\s*\]/;
    var vindex = /^\s*\[\s*(?:(\d+)\s*\*\s*)?([a-zA-Z][\w$]*)\s*(?:([+-])\s*(\d+)\s*)?\]/;
    var legs: any[] = [];

    while (nonempty.test( s )) {
      var m : string[];
      if (m = field.exec( s )) {
        legs.push( m[1] );
      }
      else if (m = cindex.exec( s )) {
        legs.push( {scale: 0, index: 0, offset: Number( m[1] )} );
      }
      else if (m = vindex.exec( s )) {
        if (m[2] == indexName) {
          var scale = 1;
          var offset = 0;
          if (m[1]) {
            scale = Number( m[1] );
          }
          if (m[4]) {
            offset = Number( m[4] );
            if (m[3] == '-') {
              offset = -offset;
            }
          }
          legs.push( new IndexPattern( scale, offset ) );
        }
        else {
          console.error( 'Unknown array index in "' + pathstr + '"' );
          return null;
        }
      }
      else {
        console.error( 'Unable to parse path "' + pathstr + '"' );
        return null;
      }
      s = s.substr( m[0].length );
    }
    return legs;
  }

}
