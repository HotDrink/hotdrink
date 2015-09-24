/*####################################################################
 * The Path class
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  // A position in a path; null for 0 dimensions, number for 1
  export
  type Position = number;

  /*==================================================================
   * Pattern for an array index in a path
   */
  export
  class IndexPattern {
    constructor( public scale: number,
                 public offset: number ) { }

    // Get the result for this pattern at a particular position
    apply( pos: Position ): Position {
      if (this.scale == 0) {
        return this.offset;
      }
      else if (pos === null) {
        return undefined;
      }
      else {
        return this.scale * pos + this.offset;
      }
    }

    // Inverse of apply: is there an index that maps to the given position?
    inverse( pos: Position ): Position {
      if (pos === null) { return undefined; }
      if (this.scale == 0) {
        return pos === this.offset ? null : undefined;
      }
      var i = (pos - this.offset) / this.scale;
      if (Math.floor( i ) === i) {
        return i;
      }
      else {
        return undefined;
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

  // Default: i
  defineArrayIndexName( 'i' );

  /*==================================================================
   * Observer of one leg of a path
   */

  type LegObserver = PropertyObserver | ArrayObserver;

  ////////////////////////////////////////////////
  // Observer the property for a specific field
  class PropertyObserver {
    constructor( public path: Path,
                 public property: r.Signal<any>,
                 public legi: number,
                 public pos: Position          ) {
      this.property.addObserverChangesOnly( this );
    }

    // No longer needed
    destruct() {
      this.property.removeObserver( this );
    }

    // Property changes
    onNext() {
      this.path.onNextProperty( this.legi, this.pos );
    }

    onError() { }
    onCompleted() { }
  }

  ////////////////////////////////////////////////
  // Observe an array for all indexes
  class ArrayObserver {
    constructor( public path: Path,
                 public ctx: ArrayContext,
                 public legi: number,
                 public pos: Position      ) {
      this.ctx.changes.addObserver( this );
    }

    // No longer needed
    destruct() {
      this.ctx.changes.removeObserver( this );
    }

    onNext( idx: number ) {
      this.path.onNextArray( idx, this.legi, this.pos );
    }

    onError() { }
    onCompleted() { }
  }

  /*==================================================================
   * An observable representing a particular property path in a
   * context.
   */
  export
  class Path extends r.BasicObservable<Position> {

    // The context at which to begin the search
    start: Context;

    // The path broken down into legs
    legs: (string|IndexPattern)[];

    // Maximum index variable used
    cardinality: number;

    // Is the path going to stay the same, or could it change?
    constant = true;

    // The branch point for the path--first variable index pattern
    private branchi = 0;

    // Observers corresponding to legs
    private observers0: LegObserver[] = null;
    private observers1: LegObserver[][] = null;

    // Path result (0-dimension) or array of results (1-dimension)
    // This not only caches the result, it's also used to decide whether
    //   a particular position had a previous result so that we can know
    //   whether anything changed
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

        // Decide whether this is 0- or 1-dimensional
        for (var i = 0, l = this.legs.length; i < l; ++i) {
          if ((<any>this.legs[i]) instanceof IndexPattern &&
              (<IndexPattern>this.legs[i]).scale != 0       ) {
            this.branchi = i + 1;
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
     * Get the current result for the path serach (from cache)
     */
    get( pos: Position ): any {
      if (this.cardinality == 0) {
        return this.result;
      }
      else if (pos !== null) {
        return this.result[pos]
      }
    }

    /*----------------------------------------------------------------
     * Called internally to add result to cache
     */
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

    /*----------------------------------------------------------------
     * Called internally to remove result from cache.
     * For 1-dimensional, position == null means remove all results.
     */
    private
    removeResult( pos: Position ) {
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
        for (var i = 0, l = this.result.length; i < l; ++i) {
          if (this.result[i] !== undefined) {
            this.sendNext( i );
          }
        }
        this.result = [];
      }
    }

    /*----------------------------------------------------------------
     * We only cache the end result; this looks up a node in the
     * middle by following the path.
     */
    private
    getUpTo( limit: number, pos: Position, ctx = this.start, legi = 0 ): any {
      for (; legi <= limit && ctx instanceof Context; ++legi) {
        var leg = this.legs[legi];
        if (typeof leg === 'string') {
          ctx = ctx[leg];
        }
        else if (leg instanceof IndexPattern) {
          var n = leg.apply( pos );
          if (n === undefined) {
            ctx = undefined;
          }
          else {
            ctx = ctx[n];
          }
        }
      }
      return legi > limit ? ctx : undefined;
    }

    /*----------------------------------------------------------------
     * Store a leg observer; assumes observer is already subscribed
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
     * Unsubscribes and removes all leg observers for position,
     * beginning at start.
     * Assumes pos === null => start < this.branchi
     *         pos !== null => start >= this.branchi
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
            var vers1 = this.observers1[i];
            if (vers1) {
              for (var j = 0, m = vers1.length; j < m; ++j) {
                var ver = vers1[j];
                if (ver) {
                  ver.destruct();
                  vers1[j] = undefined;
                }
              }
            }
          }
        }
      }
      else if (this.observers1) {
        var vers1 = this.observers1[pos];
        if (vers1) {
          for (var j = start - this.branchi, m = vers1.length; j < m; ++j) {
            var ver = vers1[j];
            if (ver) {
              ver.destruct();
              vers1[j] = undefined;
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
        // Field access
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
        // Array access
        else if (leg instanceof IndexPattern && ctx instanceof ArrayContext) {
          // Constant array access
          if (leg.scale == 0 || pos !== null) {
            var idx = leg.apply( pos );
            this.addLegObserver( new ArrayObserver( this, <ArrayContext>ctx, legi, pos ),
                                 legi, pos                                                );
            ctx = ctx[idx];
          }
          // Variable array access
          else {
            this.addLegObserver( new ArrayObserver( this, <ArrayContext>ctx, legi, pos ),
                                 legi, pos                                                );
            for (var j = 0, m = (<ArrayContext>ctx).length; j < m; ++j) {
              if (ctx[j] !== undefined) {
                var n = leg.inverse( j );
                if (n !== undefined) {
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
     * Property changed
     */
    onNextProperty( legi: number, pos: Position ) {
      this.removeResult( pos );
      this.removeLegObservers( legi + 1, pos );
      this.followPath( this.getUpTo( legi, pos ), legi + 1, pos );
    }

    /*----------------------------------------------------------------
     * Array changed
     */
    onNextArray( idx: number, legi: number, pos: Position ) {
      var update = false;
      var leg = <IndexPattern>this.legs[legi];
      // Always constant
      if (leg.scale == 0) {
        if (leg.offset === idx) {
          update = true;
        }
      }
      // Constant because pos is fixed
      else if (pos !== null) {
        if (leg.apply( pos ) === idx) {
          update = true;
        }
      }
      // Variable
      else {
        pos = leg.inverse( idx );
        update = true;
      }

      if (update) {
        this.removeResult( pos );
        this.removeLegObservers( legi + 1, pos );
        this.followPath( this.getUpTo( legi, pos ), legi + 1, pos );
      }
    }

    /*----------------------------------------------------------------
     */
    forEach( fn: (value: any, pos: Position) => void, thisObj: Object = null ) {
      if (this.cardinality == 0) {
        if (this.result !== undefined) {
          fn.call( thisObj, this.result, null );
        }
      }
      else {
        var lasti = this.legs.length - 1;
        var idxpat = <IndexPattern>this.legs[this.branchi - 1];
        var ctx = <ArrayContext>this.getUpTo( this.branchi - 2, null );
        if (ctx instanceof ArrayContext) {
          for (var i = 0, l = ctx.length; i < l; ++i) {
            if (ctx[i] !== undefined) {
              var pos = idxpat.inverse( i );
              if (pos !== null) {
                var val = this.getUpTo( lasti, pos, ctx[i], this.branchi );
                if (val) {
                  fn.call( thisObj, val, pos );
                }
              }
            }
          }
        }
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

  /*==================================================================
   */
  export
  class PathValue extends r.BasicSignal<any> {

    constructor( private path: Path ) {
      super();
      path.addObserver( this, this.onPositionChange, null, null );
      this.set( path.get( null ) );
    }

    onPositionChange() {
      this.set( this.path.get( null ) );
    }
  }
}
