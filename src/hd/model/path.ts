/*####################################################################
 * The Path class
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  /*==================================================================
   * An observable representing a particular property pat in a
   * modelcule.
   */
  export
  class Path extends r.BasicObservable<any> {

    // The modelcule at which to begin the search
    start: Modelcule;

    // The property path to follow
    path: string[];

    // Any observable properties subscribed to along the way
    properties: r.ObservableProperty<any>[] = null;

    // The result at the end of the path
    result: any;

    /*----------------------------------------------------------------
     * Perform initial search.
     */
    constructor( start: Modelcule, path: string[] ) {
      super();
      this.start = start;
      this.path = path;
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
    addObserverInit( observer: r.Observer<any> ): r.Observer<any>;
    addObserverInit( object: Object,
                     onNext: (value: any) => void,
                     onError: (error: any) => void,
                     onCompleted: () => void        ): r.Observer<any>;
    addObserverInit<U>( object: Object,
                        onNext: (value: any, id?: U) => void,
                        onError: (error: any, id?: U) => void,
                        onCompleted: (id?: U) => void,
                        id: U                                  ): r.Observer<any>;
    addObserverInit( object: Object,
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
        if (added) {
          added.onNext( this.result );
        }
        return added;
      }
      else {
        if (arguments.length == 1) {
          (<r.Observer<any>>object).onNext( this.result );
        }
        else {
          onNext.call( object, this.result, id );
        }
      }
    }

    /*----------------------------------------------------------------
     * Indicates that this path is no longer needed
     */
    cancel() {
      if (this.properties) {
        this.properties.forEach( function( p: r.ObservableProperty<any> ) {
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
      var properties: r.ObservableProperty<any>[] = [];
      var m = this.start;
      for (var i = 0, l = this.path.length; m !== null && m !== undefined && i < l; ++i) {
        var name = this.path[i];
        var propname = '$' + name;
        if (propname in m) {
          var p = m[propname];
          p.addObserver( this );
          properties.push( p );
          m = p.get();
        }
        else {
          m = m[name];
        }
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