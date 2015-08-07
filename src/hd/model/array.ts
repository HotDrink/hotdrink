/*####################################################################
 * The ArrayContext class.
 */
module hd.model {
  import u = hd.utility;
  import r = hd.reactive;

  /*==================================================================
   * JavaScript does not have multi-dimensional arrays, just
   * arrays-of-arrays.  This interface just supports generic
   * arrays-of-arrays without specifying a depth.
   */
  export
  interface MultiArray<T> extends Array<T|MultiArray<T>> { };

  /*==================================================================
   * Event signaling change to the array.
   */
  export
  interface ArrayChange {
    index: number;
    value: any;
  }

  /*==================================================================
   */
  export
  class SingleElement extends r.BasicObservable<any> {
    private index: number;

    constructor( index: number ) {
      super();
      this.index = index;
    }

    onNext( change: ArrayChange ) {
      if (change.index == this.index) {
        this.sendNext( change.value );
      }
    }

    onError( error: any ) {
      this.sendError( error );
    }

    onCompleted() {
      this.sendCompleted();
    }
  }

  /*==================================================================
   * The ArrayContext class.
   */
  export
  class ArrayContext extends Context {

    // The actual array for storing contents
    private elems: (Variable|Context)[] = [];

    // The length of the array; this controls how many properties are defined
    private length = 0;

    // Just to indicate that you can access this as an array
    [index: number]: (Variable|Context);

    // Observable for changes to the array
    changes = new r.BasicObservable<ArrayChange>();

    /*----------------------------------------------------------------
     * Length getter
     */
    getLength() { return length; }

    /*----------------------------------------------------------------
     * Length setter
     */
    setLength( n: number ) {
      // If we're decreasing length
      if (n < this.length) {
        for (var i = this.length - 1; i >= n; --i) {
          this.elems[i] = undefined;
          this.changes.sendNext( {index: i, value: undefined} );
        }
      }
      // If we're increasing length, define properties for new indices
      else {
        ArrayContext.defineNumericPropertiesUntil( n );
      }

      this.length = n;
    }

    /*----------------------------------------------------------------
     * Element getter
     */
    get( i: number ) {
      return this.elems[i];
    }

    /*----------------------------------------------------------------
     * Element setter
     */
    set( i: number, v: (Variable|Context) ) {
      // Ensure length is big enough to hold this
      if (this.length <= i) {
        this.setLength( i + 1 );
      }
      this.elems[i] = v;
      this.changes.sendNext( {index: i, value: v} );
    }

    /*----------------------------------------------------------------
     * Push operation
     */
    push( v: (Variable|Context) ) {
      var i = this.length;
      this.set( i, v );
    }

    /*----------------------------------------------------------------
     * Make sure we have numeric properties defined until n.
     * Actually starts with n and works its way down; stops as soon
     * as it finds a pre-existing numeric property.
     */
    private static
    defineNumericPropertiesUntil( n: number ) {
      for (var i = n - 1; i >= 0; --i) {
        if (ArrayContext.prototype.hasOwnProperty( i.toString() )) {
          break;
        }
        else {
          Object.defineProperty( ArrayContext.prototype, i.toString(), {
            configurable: false,
            enumerable: true,
            get: getter( i ),
            set: setter( i )
          } );
        }
      }
    }

  }

  // helper - Create getter for specified index
  function getter( i: number ) {
    return function() { return this.get( i ); };
  }

  // helper - Create setter for specified index
  function setter( i: number ) {
    return function( v: any ) { this.set( i, v ); }
  }
}
