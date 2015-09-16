/*####################################################################
 * The Path class
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  /*==================================================================
   * A /position/ is a particular assignment of values to index
   * variables.  For example, given the path template "a[i].b[j+1]",
   * the position "{i: 2, j: 4}" would yield "a[2].b[5]".
   *
   * A position which does not specify values for one or more index
   * variables represents all possible values of the unspecified index
   * variables.  So, in the above example, the position "{i: 2}" would
   * yield "a[2].b[0]", "a[2].b[1]", "a[2].b[2]", etc.
   *
   * If P and Q are positions, then Q is a sub-position of P iff every
   * index variable/value pair in P are also in Q.  So the position
   * "{i: 2, k: 6}" is a sub-position of "{i: 2, j: 4, k: 6}", and the
   * position "{}" is a sub-position of every position.
   */
  export
  type Position = u.Dictionary<number>;

  /*==================================================================
   * Legs in a path
   */

  export
  type Leg = String | IndexPattern;

  ////////////////////////////////////////////////
  // Array index pattern
  export
  class IndexPattern {
    public offset: number;
    public scale: number;
    public index: string;
    public slice: boolean;

    // Init
    constructor( offset: number );
    constructor( scale: number, index: string, offset: number );
    constructor() {
      if (arguments.length == 1) {
        this.scale = 0;
        this.offset = arguments[0];
      }
      else {
        this.scale = arguments[0];
        this.index = arguments[1];
        this.offset = arguments[2];
      }
    }

    // Get the result for this pattern at a particular position
    apply( pos: Position ) {
      if (this.scale == 0) {
        return this.offset;
      }
      else if (pos[this.index] === undefined) {
        return undefined;
      }
      else {
        return this.scale * pos[this.index] + this.offset;
      }
    }

    // Inverse of apply: what sub-postion of the current position
    // would result in this index pattern mapping to n?
    inverse( pos: Position, n: number ) {
      if (this.scale == 0) {
        return n == this.offset ? pos : undefined;
      }
      var i = (n - this.offset) / this.scale;
      if (Math.floor( i ) !== i) {
        return undefined;
      }
      if (pos[this.index] !== undefined) {
        return i == pos[this.index] ? pos : undefined;
      }
      pos = u.shallowCopy( pos );
      pos[this.index] = i;
      return pos;
    }
  }

  /*==================================================================
   * Observers for the different types of legs in a path
   */

  export
  type LegObserver = PropertyObserver | ArrayObserver;

  ////////////////////////////////////////////////
  // Observer the property for a specific field
  export
  class PropertyObserver {
    public child: LegObserver;

    constructor(
      public path:     Path,
      public property: r.Signal<any>,
      public legi:     number,
      public pos:      Position
    ) {
      this.property.addObserverChangesOnly( this );
    }

    // Observer no longer needed
    destruct() {
      this.property.removeObserver( this );
      if (this.child) {
        this.child.destruct();
      }
    }

    // Property changes
    onNext() {
      this.path.onNextProperty( this );
    }

    onError() { }
    onCompleted() { }
  }

  ////////////////////////////////////////////////
  // Observe an entire array
  export
  class ArrayObserver {
    // Whether there is just one child or multiple children depends on
    // whether we are observing the entire array or just one element
    public children: LegObserver[] = [];

    constructor(
      public path: Path,
      public ctx:  ArrayContext,
      public legi: number,
      public pos:  Position
    ) {
      if (ctx instanceof ArrayContext) {
        this.ctx.changes.addObserver( this );
      }
    }

    alsoWatchLength() {
      this.ctx.$length.addObserver( this, this.onNextLength, null, null );
    }

    // Observer no longer needed
    destruct() {
      this.ctx.changes.removeObserver( this );
      this.ctx.$length.removeObserver( this );
      if (this.hasOwnProperty( 'children' )) {
        for (var i = 0, l = this.children.length; i < l; ++i) {
          var child = this.children[i];
          if (child) {
            child.destruct();
          }
        }
      }
    }

    onNext( idx: number ) {
      this.path.onNextArray( this, idx );
    }

    onNextLength( legnth: number ) {
      this.path.onNextArrayLength( this );
    }

    onError() { }
    onCompleted() { }
  }


  /*==================================================================
   * An observable representing a particular property path in a
   * context.
   *
   * Each path can use arbitrary variables.  The path will assign
   * an order to its variables -- i.e., i_0, i_1, i_2, ...
   *
   * Each slice is assigned a unique variable name.  These are
   * considered internal variable names.  They will not be included in
   * any positions published by the path, nor will they be looked for
   * in any positions passed to this path from the outside.  Internal
   * variable names will always come after external variable names in
   * the ordering.
   */
  export
  class Path extends r.BasicObservable<Position> {

    slices: number;

    // The context at which to begin the search
    private start: Context;

    // The path broken down into legs
    private legs: Leg[];

    // The observer tree consists of observers for every property/arrray
    // accessible by this path.  Because it is a tree, whenever any
    // property/array changes we can simply prune the entire subtree
    // under that node and rebuild using createObservers.
    private rootObserver: LegObserver;

    /*----------------------------------------------------------------
     * Perform initial search.
     */
    constructor( start: Context, path: string ) {
      super();

      // Break path down into property names and index patterns
      var legs = parse( path );
      if (legs) {
        this.start = start;
        this.legs = legs;
      }
      else {
        // Create a path which always just returns undefined
        this.start = undefined;
        this.legs = [];
      }

      this.slices = countSlices( this.legs );

      // Initialize
      this.rootObserver = this.createObservers( this.start, 0, {} );
    }

    /*----------------------------------------------------------------
     * We're no longer needed; prune observer tree
     */
    destruct() {
      if (this.rootObserver) {
        this.rootObserver.destruct();
        this.rootObserver = undefined;
      }
    }

    /*----------------------------------------------------------------
     * Is this path constant (no references/arrays)?
     */
    isConstant(): boolean {
      return this.rootObserver === undefined;
    }

    /*----------------------------------------------------------------
     * Get the current result for a position
     */
    get( pos: Position = {} ): any {
      return this.getRec( this.start, 0, pos, this.legs.length );
    }

    /*----------------------------------------------------------------
     * Get the result for a position up to the specified depth.
     */
    private
    getRec( value: any, legi: number, pos: Position, limit: number ): any {
      if (value === undefined) { return undefined; }

      // If we reach the end, return the value
      if (legi >= limit) { return value; }

      // Consider current leg
      var leg = this.legs[legi];
      if (typeof leg === 'string' && value != null) {
        // Field lookup
        return this.getRec( value[leg], legi + 1, pos, limit );
      }
      else if (leg instanceof IndexPattern) {
        if (leg.scale == 0 || leg.index in pos) {
          // Index can be determined: single value
          var idx = leg.apply( pos );
          if (idx === undefined) { return undefined; }
          return this.getRec( value[idx], legi + 1, pos, limit );
        }
        else {
          // Index undetermined: array of all values
          var results: any[] = [];
          for (var i = 0, l = value.length; i < l; ++i) {
            var newpos = leg.inverse( pos, i );
            var result = this.getRec( value[i], legi + 1, newpos, limit );
            if (result === undefined) { return undefined; }
            results.push( result );
          }
          return results;
        }
      }
      return undefined;
    }

    /*----------------------------------------------------------------
     * Examine every possible value for this path, creating observers
     * for any references found along the way.
     */
    private
    createObservers( value: any, legi: number, pos: Position ): LegObserver {
      if (value === undefined) { return; }

      // Iterate until we finish or we find a reference to observe.
      // If we find a reference, we create an observer, recurse to
      //   finish out the rest of the path, and return the observer.
      for (var l = this.legs.length; legi < l; ++legi) {
        var leg = this.legs[legi];
        // Field access
        if (typeof leg === 'string' && value !== null) {
          if (value instanceof Context) {
            var propname = '$' + leg;
            if (propname in value) {
              var prop = value[propname];
              var pobs = new PropertyObserver( this, prop, legi, pos );
              pobs.child = this.createObservers( prop.get(), legi + 1, pos );
              return pobs;
            }
          }
          value = value[leg]; // continue iteration
        }
        // Array access
        else if (leg instanceof IndexPattern &&
                 (value instanceof ArrayContext || value instanceof Array)) {
          // Constant array access
          if (leg.scale == 0 || pos[leg.index] !== undefined) {
            var idx = leg.apply( pos );
            if (value instanceof ArrayContext) {
              var aobs = new ArrayObserver( this, value, legi, pos );
              aobs.children[idx] = this.createObservers( value[idx], legi + 1, pos );
              return aobs;
            }
            value = value[idx]; // continue iteration
          }
          // Variable array access
          else {
            if (value instanceof ArrayContext) {
              // Note: an array observer for an Array (as opposed to an ArrayContext)
              //       will not actually observe, but it will manage its children
              var aobs = new ArrayObserver( this, value, legi, pos );
              for (var j = 0, m = value.length; j < m; ++j) {
                if (value[j] !== undefined) {
                  var n = leg.inverse( pos, j );
                  if (n !== undefined) {
                    aobs.children[j] = this.createObservers( value[j], legi + 1, n );
                  }
                }
              }
              if (leg.slice) {
                aobs.alsoWatchLength();
              }
            }
            return aobs;
          }
        }
        else {
          break;
        }
      }
    }

    /*----------------------------------------------------------------
     * Find first position that (1) has a value, and (2) is a
     * superposition of lock.  Lock may be empty to allow all
     * positions.
     */
    begin( lock: Position ): Position {
      return this.beginRec( this.start, 0, lock );
    }

    private
    beginRec( value: any, legi: number, lock: Position ): Position {
      // Undefined means no valid positions
      if (value === undefined) { return null; }

      // If we reach the end, then the lock indicates a valid position
      if (legi == this.legs.length) { return lock; }

      // Consider the current leg
      var leg = this.legs[legi];
      if (typeof leg === 'string' && value !== null) {
        // Only one possibility for a field
        return this.beginRec( value[leg], legi + 1, lock );
      }
      else if (leg instanceof IndexPattern &&
               (value instanceof ArrayContext || value instanceof Array)) {
        if (leg.slice) {
          // We need to find the first that works for every element of value
          return this.multiPosition( value, legi, lock );
        }
        else {
          // Is index variable locked down?
          if (leg.index in lock) {
            // Yes:  only one thing we can try
            var idx = leg.apply( lock );
            if (idx !== undefined) {
              return this.beginRec( value[idx], legi + 1, lock );
            }
          }
          else {
            // No: let's try them all and take the first one that works
            for (var idx = 0, l = value.length; idx < l; ++idx) {
              var newlock = leg.inverse( lock, idx );
              if (newlock !== undefined) {
                var found = this.beginRec( value[idx], legi + 1, newlock );
                if (found) {
                  return found;
                }
              }
            }
          }
        }
      }
      // If we make it here, then nothing worked
      return null;
    }

    /*----------------------------------------------------------------
     * Find first position /after/ specified position which is a
     * subposition of lock.  Lock may be empty to allow all
     * positions
     */
    next( lock: Position, pos: Position ): Position {
      return this.nextRec( this.start, 0, lock, pos );
    }

    private
    nextRec( value: any, legi: number, lock: Position, pos: Position ): Position {
      // If we run out of values or reach the end, then there's nothing
      //   more that we can do:  there is no next value
      if (value === undefined) { return null; }
      if (legi == this.legs.length) { return null; }

      // Consider the current leg
      var leg = this.legs[legi];
      if (typeof leg === 'string' && value !== null) {
        // A field cannot be changed; we'll have to keep looking
        return this.nextRec( value[leg], legi + 1, lock, pos );
      }
      else if (leg instanceof IndexPattern &&
               (value instanceof ArrayContext || value instanceof Array)) {
        if (leg.slice) {
          // We need to find the next that works for every element of value
          return this.multiPosition( value, legi, lock, pos );
        }
        else {
          // Figure out which element is currently being used
          var idx = leg.apply( pos );
          if (idx === undefined) { return null; } // shouldn't happen --
                                                  // pos should be a valid position
          if (leg.index in lock) {
            // If it's locked, it cannot be changed; we'll have to keep looking
            return this.nextRec( value[idx], legi + 1, lock, pos );
          }
          else {
            // First see if we can do a next while staying on the current element
            //   by locking down this index
            var extLock = u.shallowCopy( lock );
            extLock[leg.index] = idx;
            var found = this.nextRec( value[idx], legi + 1, extLock, pos );
            if (found) { return found; }

            // If that didn't work, try remaining elements to see if we
            //   can find something
            var l: number;
            for (++idx, l = value.length; idx < l; ++idx) {
              var newpos = leg.inverse( lock, idx );
              if (newpos !== undefined) {
                var found = this.beginRec( value[idx], legi + 1, newpos );
                if (found) { return found; }
              }
            }
          }
        }
      }
      // If we make it here, then nothing worked
      return null;
    }

    /*----------------------------------------------------------------
     * Find the first/next position which (1) produces valid results
     * for /all/ values, and (2) is a superposition of lock. (If
     * from is specified, it's next; if not, it's first.)
     */
    private
    multiPosition(
      values: ArrayContext | Array<any>,
      legi:   number,
      lock:   Position,
      from?:  Position
    ):        Position {

      var locks: Position[], dir: number;
      // The position at locks[i] is used to query a position from values[i].
      // The position returned becomes the lock for the next value.
      // If dir == 1, then the previous position query worked and we're moving
      //   ahead to try the next one ==> use begin
      // If dir == -1, then the previous position query failed and we're backing
      //   up to try to find a different lock ==> use next

      if (from) {
        locks = [lock, from];
        dir = -1;
      }
      else {
        locks = [lock];
        dir = 1;
      }

      for (var idx = 0, l = values.length; idx >= 0 && idx < l; idx += dir) {
        if (dir > 0) {
          locks[idx + 1] = this.beginRec( values[idx], legi + 1, locks[idx] );
        }
        else {
          locks[idx + 1] = this.nextRec( values[idx], legi + 1, locks[idx], locks[idx + 1] );
        }
        dir = locks[idx + 1] === null ? -1 : 1;
      }

      // Either we made it all the way to the end, or we regressed to the beginning
      if (idx == values.length) {
        return locks[idx];
      }
      else {
        return null;
      }
    }

    /*----------------------------------------------------------------
     * This is basically the same as the previous, except that,
     * instead of iterating over a list of intermediate values from
     * the same path, we're iterating over a list of paths.
     */
    private static
    multiPosition(
      paths: Path[],
      lock:  Position,
      from?: Position
    ):       Position {

      var locks: Position[], dir: number;
      // The position at locks[i] is used to query a position from values[i].
      // The position returned becomes the lock for the next value.
      // If dir == 1, then the previous position query worked and we're moving
      //   ahead to try the next one ==> use begin
      // If dir == -1, then the previous position query failed and we're backing
      //   up to try to find a different lock ==> use next

      if (from) {
        locks = [lock, from];
        dir = -1;
      }
      else {
        locks = [lock];
        dir = 1;
      }

      for (var idx = 0, l = paths.length; idx >= 0 && idx < l; idx += dir) {
        if (dir > 0) {
          locks[idx + 1] = paths[idx].begin( locks[idx] );
        }
        else {
          locks[idx + 1] = paths[idx].next( locks[idx], locks[idx + 1] );
        }
        dir = locks[idx + 1] === null ? -1 : 1;
      }

      // Either we made it all the way to the end, or we regressed to the beginning
      if (idx == paths.length) {
        return locks[idx];
      }
      else {
        return null;
      }
    }

    static
    beginAll( paths: Path[] ): Position {
      return Path.multiPosition( paths, {} );
    }

    static
    nextAll( paths: Path[], pos: Position ): Position {
      return Path.multiPosition( paths, {}, pos );
    }

    /*----------------------------------------------------------------
     * Property changed
     */
    onNextProperty( obs: PropertyObserver ) {
      if (obs.child) {
        obs.child.destruct();
      }
      obs.child = this.createObservers(
        this.getRec( this.start, 0, obs.pos, obs.legi + 1 ),
        obs.legi + 1,
        obs.pos
      );
      this.sendNext( obs.pos );
    }

    /*----------------------------------------------------------------
     * Array changed
     */
    onNextArray( obs: ArrayObserver, idx: number ) {
      var leg = <IndexPattern>this.legs[obs.legi];
      var newpos = leg.inverse( obs.pos, idx );
      if (newpos !== undefined) {
        if (obs.children[idx]) {
          obs.children[idx].destruct();
        }
        obs.children[idx] = this.createObservers(
          this.getRec( this.start, 0, newpos, obs.legi + 1 ),
          obs.legi + 1,
          newpos
        );
        this.sendNext( newpos );
      }
    }

    /*----------------------------------------------------------------
     * Array size changed (only for slices)
     */
    onNextArrayLength( obs: ArrayObserver ) {
      this.sendNext( obs.pos );
    }

  }

  /*==================================================================
   * Parse path into legs
   */

  export
  function parse( pathstr: string ): Leg[] {
    var s = pathstr;
    var nonempty = /\S/;
    var field = /^\s*\.?([a-zA-Z][\w$]*)/;
    var cindex = /^\s*\[\s*(\d+)\s*\]/;
    var vindex = /^\s*\[\s*(\d+)?\s*(\*|[a-zA-Z][\w$]*)\s*(?:([+-])\s*(\d+)\s*)?\]/;
    var legs: Leg[] = [];
    var temps = 0;

    while (nonempty.test( s )) {
      var m : string[];
      if (m = field.exec( s )) {
        legs.push( m[1] );
      }
      else if (m = cindex.exec( s )) {
        legs.push( new IndexPattern( Number( m[1] ) ) );
      }
      else if (m = vindex.exec( s )) {
        var index: string;
        var slice: boolean;
        if (m[2] == '*') {
          index = '#' + temps++;
          slice = true;
        }
        else {
          index = m[2];
          slice = false;
        }

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
        var pat = new IndexPattern( scale, index, offset);
        if (slice) {
          pat.slice = true;
        }
        legs.push( pat );
      }
      else {
        console.error( 'Unable to parse path "' + pathstr + '"' );
        return null;
      }
      s = s.substr( m[0].length );
    }
    return legs;
  }

  function countDimensions( legs: Leg[] ) {
    var dimensions = 0;
    var variables: u.Dictionary<boolean> = {};
    for (var i = 0, l = legs.length; i < l; ++i) {
      var leg = legs[i];
      if (leg instanceof IndexPattern &&
          ! leg.slice &&
          ! variables[leg.index]) {
        ++dimensions;
        variables[leg.index] = true;
      }
    }
    return dimensions;
  }

  function countSlices( legs: Leg[] ) {
    var slices = 0;
    for (var i = 0, l = legs.length; i < l; ++i) {
      var leg = legs[i];
      if (leg instanceof IndexPattern && leg.slice) {
        ++slices;
      }
    }
    return slices;
  }

  /*==================================================================
   */
  export
  class PathValue extends r.BasicSignal<any> {

    constructor( private path: Path ) {
      super();
      path.addObserver( this, this.onPositionChange, null, null );
      this.set( path.get( {} ) );
    }

    onPositionChange() {
      this.set( this.path.get( {} ) );
    }
  }

}
