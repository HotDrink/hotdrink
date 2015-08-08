/*####################################################################
 * The Path class
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  export
  type Position = number;

  export
  type PositionSet = u.ArraySet<number>;

  export
  function addPosition( set: PositionSet, pos: Position ) {
    if (set === null || pos === null) { return null; }
    return u.arraySet.add( set, pos );
  }

  export
  function hasPosition( set: PositionSet, pos: Position ) {
    if (set === null) { return true; }
    if (pos === null) { return false; }
    return u.arraySet.contains( set, pos );
  }

  export union( target: PositionSet, set: PositionSet ) {
    if (target === null || set === null) { return null; }
    for (var i = 0, l = set.length; i < l; ++i) {
      u.arraySet.add( target, set[i] );
    }
    return target;
  }

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
      else {
        return this.scale * pos + this.offset;
      }
    }

    // Inverse of apply: what value of index variable would
    //   result in the value for that variable in given position?
    inverse( pos: Position ): Position {
      if (this.scale == 0) { return null; }
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
    private cardinality: number;

    // Doesn't subscribe to any properties or arrays
    private constant = true;

    // Any observable properties subscribed to along the way
    observables0: r.ProxyObservable<any>[] = null;
    observables1: r.ProxyObservable<any>[][] = null;

    // The result (or array of results) at the end of the path
    result: any;

    /*----------------------------------------------------------------
     * Perform initial search.
     */
    constructor( start: Context, path: string ) {
      super();
      this.start = start;

      // Break path down into property names and index patterns
      var legs = parse( path );
      var cardinality = -1;
      if (legs) {
        cardinality = calcCardinality( path, legs );
      }
      if (legs && cardinality >= 0) {
        this.legs = legs;
        this.cardinality = cardinality;
      }
      else {
        // Create a path which always just returns undefined
        this.start = undefined;
        this.legs = [];
        this.cardinality = 0;
      }

      if (cardinality == 1) {
        this.result = [];
      }

      this.path = path.split( '.' );
      this.followPath();
    }

    /*----------------------------------------------------------------
     * Were there any properties in the path?
     */
    isConstant(): boolean {
      return this.constant;
    }

    /*----------------------------------------------------------------
     * The current result for the path serach
     */
    get( pos: Position ): any {
      if (this.cardinality == 0 && pos === null) {
        return this.result;
      }
      if (this.cardinality == 1 && pos !== null) {
        return this.result[pos];
      }
    }

    /*----------------------------------------------------------------
     */
    private
    addResult( pos: Position, val: any ) {
      if (this.cardinality == 0 && pos === null) {
        this.result = val;
      }
      else if (this.cardinality == 1 && pos !== null) {
        this.result[pos] = val;
      }
    }

    /*----------------------------------------------------------------
     */
    private
    addObservable( pos: Position, vable: ProxyObservable ) {
      if (pos === null) {
        if (! this.observables0) {
          this.observables0 = [vable];
        }
        else {
          this.observables0.push( vable );
        }
      }
      else {
        if (! this.observables1) {
          this.observables1 = [];
        }
        if (! this.observables1[pos]) {
          this.observables1[pos] = [vable];
        }
        else {
          this.observables1[pos].push( vable );
        }
      }
    }

    /*----------------------------------------------------------------
     * Perform the search, subscribing to any properties encountered.
     */
    private
    followPath( ctx: Context, i: number; pos: Position ) {

      for (var l = this.legs.length; i < l && ctx instanceof Context; ++i) {
        var leg = this.legs[i];
        if (typeof leg === 'string') {
          var propname = '$' + leg;
          if (propname in ctx) {
            var p = ctx[propname];
            p.addObserverChangesOnly( this, this.onNextProperty, null, null, pos );
            this.addObservable( pos, p );
            ctx = p.get();
          }
          else {
            ctx = ctx[leg];
          }
        }
        else if (leg instanceof IndexPattern && ctx instanceof ArrayContext) {
          if (leg.scale == 0 || pos !== null) {
            var idx = leg.apply( pos );
            ctx.addObserver( this, this.onNextArray, null, null, {ctx: ctx, legi: i, pos: pos} );
            ctx = ctx[idx];
          }
          else {
            ctx.addObserver( this, this.onNextArray, null, null, {ctx: ctx, legi: i, pos: pos} );
            for (var j = 0, m = ctx.length; j < m; ++j) {
              if (ctx[j] !== undefined) {
                var n = leg.inverse( j );
                if (n !== null) {
                  this.followPath( ctx[j], i + 1, n );
                }
              }
            }
            break; // we followed the rest recursively
          }
        }
      }

      if (i == l && ctx !== undefined) {
        this.addResult( pos, ctx );
      }
    }

    /*----------------------------------------------------------------
     */
    private followOnePath( pos: Position ) {
      var ctx = this.start;
      for (var i = 0, l = this.legs.length; i < l && ctx instanceof Context; ++i) {
        var leg = this.legs[i];
        if (typeof leg === 'string') {
          ctx = ctx[leg];
        }
        else if (leg instanceof IndexPattern && ctx instanceof ArrayContext) {
          if (leg.scale == 0) {
            var idx = leg.apply( pos );
            ctx = ctx[idx];
          }
          else {
            var n = leg.inverse( j );
            if (n !== nul) {
              this.followPath( ctx[j], i + 1, n );
            }
            break;
          }
        }
      }
    }

    /*----------------------------------------------------------------
     * Indicates that this path is no longer needed
     */
    cancel( pos: Position ) {
      if (pos === null) {
        if (this.observables1) {
          this.observables1.forEach( this.unsubscribeAll, this );
          this.observables1 = null;
        }
        this.unsubscribeAll( this.observables0 );
        this.observables0 = null;
      }
      else {
        if (this.observables1[pos]) {
          this.unsubscribeAll( this.observables1[pos] );
          this.observables1[pos] = null;
        }
      }
    }

    private
    unsubscribeAll( vables: ProxyObservable[] ) {
      if (vables) {
        vables.forEach( this.unsubsribe, this );
      }
    }

    private
    unsubscribe( vable: ProxyObservable ) {
      if (vable) {
        vable.removeObserver( this );
      }
    }

    /*----------------------------------------------------------------
     */
    onNextProperty( val: any, pos: Position ) {
      this.cancel( p.pos );
      if (pos == null) {
        this.followPath( this.start, 0, null );
      }
      else {
        this.followOnePath( pos );
      }
      this.sendNext( pos );
    }

    /*----------------------------------------------------------------
     */

    onNextArray( idx: number, p: {ctx: Context, legi: number, pos: Position} ) {
      var leg = this.legs[p.legi];
      var n = leg.inverse( idx );
      if (n !== null && (pos === null || pos === n) {
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
    var vindex = /^\s*\[\s*(\d+)([a-zA-Z][\w$]*)\s*(?:([+-])\s*(\d+)\s*)?\]/;
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
          var scale = 0;
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
   * Make sure indices are used in correct order;
   * calculate cardinality.
   */
  export
  function calcCardinality( path: string, legs: (string|IndexPattern)[] ) {
    for (var i = 0, l = legs.length; i < l; ++i) {
      if (typeof legs[i] !== 'string' && (<IndexPattern>legs[i]).scale != 0) {
        return 1;
      }
    }
    return 0;
  }

}
