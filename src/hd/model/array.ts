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
    private elements: any[] = [];

    // The length of the array; this controls how many properties are defined
    private _length = 0;
    length: number;

    // Just to indicate that you can access this as an array
    [index: number]: any;

    // Observable for changes to the array
    changes = new r.BasicObservable<number>();

    /*----------------------------------------------------------------
     */
    constructor( private klass?: ContextClass,
                 private spec?: ContextSpec    ) {
      super();
    }

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
          if (this.elements[i] !== undefined) {
            this.elements[i] = undefined;
            this.changes.sendNext( i );
          }
        }
      }
      // If we're increasing length, define properties for new indices
      else {
        for (var i = this._length; i < n; ++i) {
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
      return this.elements[i];
    }

    /*----------------------------------------------------------------
     * Element setter
     */
    set( i: number, v: any ) {
      // Ensure length is big enough to hold this
      if (this._length <= i) {
        this.setLength( i + 1 );
      }
      if (this.elements[i] !== undefined || v !== undefined) {
        this.elements[i] = v;
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

    /*----------------------------------------------------------------
     */
    expand( count: number, start = this.elements.length ) {
      if (count > 0) {
        // Set length
        var oldLength = this.getLength();
        var newLength = oldLength + count;
        this.setLength( newLength );

        // Copy old stuff foward
        for (var i = oldLength - 1; i >= start; --i) {
          this.set( i + count, this.elements[i] );
        }

        // Initialize new spaces
        if (this.klass || this.spec) {
          var klass = this.klass || Context;
          var spec = this.spec;
          for (var i = start, l = start + count; i < l; ++i) {
            var ctx = new klass();
            if (spec) {
              Context.construct( ctx, spec );
            }
            this.set( i, ctx );
            Context.claim( this, ctx );
          }
        }
        else {
          for (var i = start, l = start + count; i < l; ++i) {
            this.set( i, undefined );
          }
        }
      }
    }

    /*----------------------------------------------------------------
     */
    collapse( count: number, start = this.elements.length - count ) {
      if (count > 0) {
        var oldLength = this.getLength();
        var newLength = oldLength - count;

        // Destruct existing spaces
        for (var i = start, l = start + count; i < l; ++i) {
          var ctx = this.elements[i];
          if (ctx !== undefined &&
              Context.release( this, ctx ) &&
              ctx instanceof Context         ) {
            ctx.destruct();
          }
        }

        // Copy old stuff backward
        for (var i = start; i < newLength; ++i) {
          this.set( i, this.elements[i + count] );
        }

        // Set length
        this.setLength( newLength )
      }
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
