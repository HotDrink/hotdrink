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
   */
  export
  class SingleElement extends r.BasicObservable<any> {
    private index: number;

    constructor( index: number ) {
      super();
      this.index = index;
    }

    onNext( index: number ) {
      if (index == this.index) {
        this.sendNext( index );
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
    private elems: any[] = [];

    // The length of the array; this controls how many properties are defined
    private _length = 0;
    length: number;

    // Just to indicate that you can access this as an array
    [index: number]: any;

    // Observable for changes to the array
    changes = new r.BasicObservable<number>();

    /*----------------------------------------------------------------
     * Length getter
     */
    getLength() { return this._length; }

    /*----------------------------------------------------------------
     * Length setter
     */
    setLength( n: number ) {
      // If we're decreasing length
      if (n < this._length) {
        for (var i = this._length - 1; i >= n; --i) {
          this.elems[i] = undefined;
          this.changes.sendNext( i );
        }
      }
      // If we're increasing length, define properties for new indices
      else {
        for (var i = this._length; i < n; ++i) {
          this.changes.sendNext( i );
          if (! ArrayContext.prototype.hasOwnProperty( i.toString() )) {
            Object.defineProperty( ArrayContext.prototype, i.toString(), {
              configurable: false,
              enumerable: true,
              get: getter( i ),
              set: setter( i )
            } );
          }
        }
      }

      this._length = n;
    }

    /*----------------------------------------------------------------
     * Element getter
     */
    get( i: number ): any {
      return this.elems[i];
    }

    /*----------------------------------------------------------------
     * Element setter
     */
    set( i: number, v: any ) {
      // Ensure length is big enough to hold this
      if (this._length <= i) {
        this.setLength( i + 1 );
        this.elems[i] = v;
      }
      else {
        this.elems[i] = v;
        this.changes.sendNext( i );
      }
    }

    /*----------------------------------------------------------------
     * Push operation
     */
    push( v: any ) {
      var i = this._length;
      this.set( i, v );
    }

  }

  Object.defineProperty( ArrayContext.prototype, "length",
                         {configurable: false,
                          enumerable: false,
                          get: ArrayContext.prototype.getLength,
                          set: ArrayContext.prototype.setLength} );

  // helper - Create getter for specified index
  function getter( i: number ) {
    return function() { return this.get( i ); };
  }

  // helper - Create setter for specified index
  function setter( i: number ) {
    return function( v: any ) { this.set( i, v ); }
  }
}
