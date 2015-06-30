/*####################################################################
 * The Path class
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

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
    properties: r.ProxySignal<any>[] = null;

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
      return ! this.properties;
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
      if (this.properties) {
        var added: r.Observer<any>;
        if (arguments.length === 1) {
          added = super.addObserver( <r.Observer<any>>object );
        }
        else {
          added = super.addObserver( object, onNext, onError, onCompleted, id );
        }
        return added;
      }
      else {
        if (arguments.length == 1) {
          (<r.Observer<any>>object).onCompleted();
        }
        else {
          onCompleted.call( object, id );
        }
      }
    }

    /*----------------------------------------------------------------
     * Indicates that this path is no longer needed
     */
    cancel() {
      if (this.properties) {
        this.properties.forEach( function( p: r.ProxySignal<any> ) {
          p.removeObserver( this );
        }, this );
        this.properties = null;
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
        this.properties = properties;
      }
      else {
        // should be unnecessary, but just in case
        this.properties = null;
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
}
