/*####################################################################
 * The Path class
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

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
    apply( pos: Position ) {
      if (this.scale == 0) {
        return this.offset;
      }
      else {
        return this.scale * pos + this.offset;
      }
    }

    // Inverse of apply: what value of index variable would
    //   result in the value for that variable in given position?
    inverse( pos: Position ) {
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
    path: string[];

    // Any observable properties subscribed to along the way
    observables0: r.ProxyObservable<any>[] = null;
    observables1: r.ProxyObservable<any>[][] = null;

    // The result at the end of the path
    result: any;

    /*----------------------------------------------------------------
     * Perform initial search.
     */
    constructor( start: Context, path: string ) {
      super();
      this.start = start;
      this.path = path.split( '.' );
      this.followPath();
    }

    /*----------------------------------------------------------------
     * The current result for the path serach
     */
    get(): any {
      return this.result;
    }

    /*----------------------------------------------------------------
     * Were there any properties in the path?
     */
    isConstant(): boolean {
      return ! this.observables0 && ! this.observables1;
    }

    /*----------------------------------------------------------------
     * Subscribe and receive the first value.
     */
    addObserver( observer: r.Observer<any> ): r.Observer<any>;
    addObserver( object: Object,
                 onNext: (value: any) => void,
                 onError: (error: any) => void,
                 onCompleted: () => void        ): r.Observer<any>;
    addObserver<U>( object: Object,
                    onNext: (value: any, id?: U) => void,
                    onError: (error: any, id?: U) => void,
                    onCompleted: (id?: U) => void,
                    id: U                                  ): r.Observer<any>;
    addObserver( object: Object,
                 onNext?: (value: any, id?: any) => void,
                 onError?: (error: any, id?: any) => void,
                 onCompleted?: (id?: any) => void,
                 id?: any                                  ): r.Observer<any> {
      if (this.isConstant()) {
        if (arguments.length == 1) {
          (<r.Observer<any>>object).onCompleted();
        }
        else {
          onCompleted.call( object, id );
        }
      }
      else {
        var added: r.Observer<any>;
        if (arguments.length === 1) {
          added = super.addObserver( <r.Observer<any>>object );
        }
        else {
          added = super.addObserver( object, onNext, onError, onCompleted, id );
        }
        return added;
      }
    }

    /*----------------------------------------------------------------
     * Indicates that this path is no longer needed
     */
    cancel() {
      if (! this.isConstant()) {
        this.observables0.forEach( function( p: r.ProxySignal<any> ) {
          p.removeObserver( this );
        }, this );
        this.observables0 = null;
      }
    }

    /*----------------------------------------------------------------
     * Perform the search, subscribing to any properties encountered.
     */
    private
    followPath() {
      var properties: r.ProxySignal<any>[] = [];
      var m = this.start;
      for (var i = 0, l = this.path.length; typeof m === 'object' && m !== null && i < l; ++i) {
        var name = this.path[i];
        var propname = '$' + name;
        if (propname in m) {
          var p = m[propname];
          p.addObserverChangesOnly( this );
          properties.push( p );
          m = p.get();
        }
        else {
          m = m[name];
        }
      }
      if (i < l) {
        m = undefined;
      }
      if (m !== this.result) {
        this.result = m;
        this.sendNext( m );
      }
      if (properties.length > 0) {
        this.observables0 = properties;
      }
      else {
        // should be unnecessary, but just in case
        this.observables0 = null;
        this.sendCompleted();
      }
    }

    /*----------------------------------------------------------------
     * One of the propeties on which the result depends has changed.
     * Unsubscribe from all properties and redo search.
     */
    private
    onNext() {
      this.cancel();
      this.followPath();
    }

    /*----------------------------------------------------------------
     * Should not occur; but if it does, treat it like a property
     * change.
     */
    private
    onError() {
      this.cancel();
      this.followPath();
    }

    /*----------------------------------------------------------------
     * Should not occur; but if it does, treat it like a property
     * change.
     */
    private
    onCompleted() {
      this.cancel();
      this.followPath();
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
