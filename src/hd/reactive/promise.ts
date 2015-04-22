/*####################################################################
 * This is an implementation of the Promises/A+ standard.  See
 *   http://promisesaplus.com/
 * The entire spec is implemented.  Additionally, I have added extra
 * functionality in response to needs of our particular library.
 * Extra features are:
 *
 * 1.) Promise doubles as an Observable.  It issues an onNext for each
 *     notification.  If promise is fulfilled, it issues an onNext
 *     followed by an onCompleted.  If promise is rejected, it issues
 *     an onError followed by an onCompleted.
 *
 * 2.) Promise has an observable event named "ondropped".  This event
 *     sends onNext any time the last dependency of a promise is
 *     removed --- i.e., whenever the promise has a single dependency,
 *     and "removeDependency" is called to remove it.  Notes:
 *
 *     - A dependency is different from an observer.  This event fires
 *       only when the last dependency is removed, regardless of
 *       whether or not there are observers.
 *
 *     - When a promise is settled, the event sends onCompleted.
 *
 *     - The value sent for onNext is the promise itself.
 *
 * 3.) Promise is an Observer<Promise>.  Any promise received is
 *     immediately removed as a dependency.  Thus, given two promises,
 *     p and q, the following code:
 *
 *         p.addDependency( q );
 *         q.ondropped.addObserver( p );
 *
 *     has the this effect: If p is settled, the result passes on to
 *     q.  If q ever fires an ondropped event, then it is removed as a
 *     dependency from p.
 */

module hd.reactive {

  import u = hd.utility;

  export var PromisePriority = 2;
  export var DroppedPriority = 1;

  /*==================================================================
   */
  export interface PromiseStatus<T> {
    state: string;
    value?: T;
    reason?: any;
  }

  /*==================================================================
   * A computation which depends on a promised value.  May optionally
   * produce its own value.
   */
  export interface Dependency<T,U> {
    onFulfilled( value: T ): U;
    onRejected( reason: any ): U;
    onProgress( value: T ): void;
  }

  /*==================================================================
   * Private type associating a dependency with the promise for the
   * dependency's value.
   */
  class DependencyBinding<T,U> {
    constructor( public object: Object,
                 public fulfilled_cb: (value: T, id?: any) => U,
                 public rejected_cb: (reason: any, id?: any) => U,
                 public progress_cb: (value: T, id?: any) => void,
                 public id: any,
                 public promise?: Promise<U>                       ) { }

    onFulfilled( value: T ) {
      if (this.fulfilled_cb) {
        callHandler( this.fulfilled_cb,   // call this function
                     this.object,         // on this object
                     value,               // passing this value
                     this.id,             // and this identifier
                     this.promise         // result resolves this prmoise
                   );
      }
      else if (this.promise) {
        this.promise.resolve( <any>value );  // Must assume T == U
      }
    }

    onRejected( reason: any ) {
      if (this.rejected_cb) {
        callHandler( this.rejected_cb,    // call this function
                     this.object,         // on this object
                     reason,              // passing this value
                     this.id,             // and this identifier
                     this.promise         // result resolves this promise
                   );
      }
      else if (this.promise) {
        this.promise.reject( reason );
      }
    }

    onProgress( value: T ) {
      if (this.progress_cb) {
        callHandler( this.progress_cb,    // call this function
                     this.object,         // on this object
                     value,               // passing this value
                     this.id,             // and this identifier
                     undefined            // result resolves this promise
                   );
      }
    }
  }

  /*==================================================================
   * Private enum for promise state
   */
  export enum State { Pending, Fulfilled, Rejected }

  export enum Usage { Unknown, Used, Unused, Delayed };

  /*==================================================================
   * Implementation of Promises/A+.
   */
  export class Promise<T> extends BasicObservable<T> {

    // For debug purposes only
    id: string;

    // List of dependencies for this promise
    // (Note: inherits empty list from prototype; copies on write)
    private dependencies: Dependency<T,any>[];

    // State of the promise
    private state: State = State.Pending;

    // Whether this promise has been resolved with another promise
    private open = true;

    // Value (after it has been fulfilled)
    private value: T;

    // Error (after it has been rejected)
    private reason: any;

    // Promise usage
    usage = new ObservableProperty( Usage.Unknown );

    // Event fired when promise loses all observers
    ondropped = new BasicObservable<Promise<T>>();

    /*----------------------------------------------------------------
     * Option to create promise already fulfilled.
     */
    constructor( value?: T ) {
      super();
      if (arguments.length > 0) {
        this.resolve( value );
      }
    }

    /*----------------------------------------------------------------
     * State inspection methods.
     */
    isFulfilled() {
      return this.state === State.Fulfilled;
    }

    isRejected() {
      return this.state === State.Rejected;
    }

    isPending() {
      return this.state === State.Pending;
    }

    isSettled() {
      return this.state !== State.Pending;
    }

    hasValue() {
      return 'value' in this;
    }

    inspect(): PromiseStatus<T> {
      if (this.state === State.Fulfilled) {
        return {state: 'fulfilled', value: this.value};
      }
      else if (this.state === State.Rejected) {
        return {state: 'rejected', reason: this.reason};
      }
      else {
        if ('value' in this) {
          return {state: 'pending', value: this.value}
        }
        else {
          return {state: 'pending'};
        }
      }
    }


    /*----------------------------------------------------------------
     * Subscribe dependency to be run once promise is resolved.
     *
     * Note that this implementation does not watch for duplicate
     * dependencies; adding a dependency twice will result in it
     * being executed twice.
     */
    addDependency<U>( dependency: Dependency<T,U> ): Dependency<T,U>;
    addDependency<U>( object: Object,
                      onFulfilled: (value: T) => U,
                      onRejected: (reason: any) => U,
                      onProgress: (value: T) => void ): Dependency<T,void>;
    addDependency<U,V>( object: Object,
                        onFulfilled: (value: T, id?: V) => U,
                        onRejected: (reason: any, id?: V) => U,
                        onProgress: (value: T, id?: V) => void,
                        id: V                                   ): Dependency<T,void>;
    addDependency( object: Object,
                   onFulfilled?: (value: T, id?: any) => any,
                   onRejected?: (reason: any, id?: any) => any,
                   onProgress?: (value: T, id?: any) => void,
                   id?: any                                     ) {
      var dependency: Dependency<T,any>;
      if (arguments.length == 1) {
        dependency = <Dependency<T,any>>object;
      }
      else {
        dependency =
              new DependencyBinding( object,
                                     onFulfilled,
                                     onRejected,
                                     onProgress,
                                     id
                                   );
      }
      if (this.state !== State.Pending) {
        u.schedule( PromisePriority, this.dischargeDependency, this, dependency );
      }
      else {
        // Debug info
        if (plogger && this.dependencies.length == 0) {
          plogger.nowHasDependencies( this );
        }
        if (this.hasOwnProperty( 'dependencies' )) {
          this.dependencies.push( dependency );
        }
        else {
          // copy on write
          this.dependencies = [dependency];
        }
      }
      if (this.usage.get() === Usage.Unknown) {
        this.usage.set( Usage.Used );
      }

      return dependency;
    }

    /*----------------------------------------------------------------
     * Subscribe dependency to be run once promise is resolved.
     *
     * This is almost exactly the same as `addDependency` above,
     * except that a promise is created for the result of the
     * dependency.
     */
    bindDependency<U>( promise: Promise<U>,
                       dependency: Dependency<T,U> ): Dependency<T,void>;
    bindDependency<U>( promise: Promise<U>,
                       object: Object,
                       onFulfilled: (value: T) => U,
                       onRejected: (reason: any) => U,
                       onProgress: (value: T) => void  ): Dependency<T,void>;
    bindDependency<U,V>( promise: Promise<U>,
                         object: Object,
                         onFulfilled: (value: T, id?: V) => U,
                         onRejected: (reason: any, id?: V) => U,
                         onProgress: (value: T, id?: V) => void,
                         id: V                                   ): Dependency<T,void>;
    bindDependency<U,V>( promise: Promise<U>,
                         object: Object,
                         onFulfilled?: (value: T, id?: V) => U,
                         onRejected?: (reason: any, id?: V) => U,
                         onProgress?: (value: T, id?: V) => void,
                         id?: V                                   ): Dependency<T,void> {
      var binding: DependencyBinding<T, U>;
      if (arguments.length < 3) {
        var d = <Dependency<T,U>>object;
        binding = <any>this.addDependency(
          object, d.onFulfilled, d.onRejected, d.onProgress
        );
      }
      else {
        binding = <any>this.addDependency(
          object, onFulfilled, onRejected, onProgress, id
        );
      }
      binding.promise = promise;
      return binding;
    }

    /*----------------------------------------------------------------
     * Unsubscribe a dependency.
     *
     * Note that this implementation does not watch for duplicate
     * dependencies; this will only remove a single subscription of
     * the dependency.  If a dependency has been added multiple times
     * then it must be removed multiple times.
     */
    removeDependency( object: Object ): boolean {
      var found = false;
      for (var i = this.dependencies.length - 1; i >= 0; --i) {
        var d = this.dependencies[i];
        if (d === object ||
            (d instanceof DependencyBinding &&
             (<DependencyBinding<T,any>>d).object === object)) {
          this.dependencies.splice( i, 1 );

          // Check to see if this promise is dropped
          if (this.dependencies.length == 0) {
            // Debug info
            if (plogger) {
              plogger.lostAllDependencies( this );
            }
            u.schedule( DroppedPriority, this.ondropped.sendNext, this.ondropped, this );
          }

          found = true;
        }
      }
      return found;
    }

    /*----------------------------------------------------------------
     */
    hasDependencies(): boolean {
      return this.dependencies.length > 0;
    }

    /*----------------------------------------------------------------
     * Called to give the the next step towards resolving a promise.
     *
     * If given a value, the value fulfills the promise.
     * If given a promise, this promise is unified with it.
     */
    resolve( value: T ): void;
    resolve( value: Promise<T> ): void;
    resolve( value: {then: (t: T) => any} ): void;
    resolve( value: any ): void {
      if (this.open) {
        this.resolveFirst( value );
      }
    }

    private resolveFirst( value: any ): void {
      if (this.state === State.Pending) {

        if (value === this) {
          this.reject( new TypeError( "Attempted to resolve a promise with itself" ) );
        }
        else {
          if (value instanceof Promise) {
            // When other promise resolves, we resolve
            this.open = false;
            value.addDependency( this );
          }
          else if ((typeof value === 'object' || typeof value === 'function') &&
                   typeof value.then === 'function') {
            // Provides compatability with other promise implementations
            this.open = false;
            this.resolveThen( value );
          }
          else {
            // A value fulfills the promise
            this.fulfill( value );
          }
        }

      }
    }

    /*----------------------------------------------------------------
     * Resolves a value that is not a promise but does have a "then"
     * method.
     *
     * Basically this is a wrapper to make sure the "then" method
     * behaves like a promise: only resolves/rejects once; doesn't
     * throw exceptions
     */
    private resolveThen( value: {then: Function} ) {
      var pending = true;
      var This = this;
      try {
        value.then( function( value: T ) {
          if (pending) {
            pending = false;
            This.resolve( value );
          }
        }, function( reason: any ) {
          if (pending) {
            pending = false;
            This.reject( reason );
          }
        }, function( value: T ) {
          if (pending) {
            This.notify( value );
          }
        } );
      }
      catch (e) {
        if (pending) {
          pending = false;
          This.reject( e );
        }
      }
    }

    /*----------------------------------------------------------------
     * Called when resolving concluded we really have a value and
     * not a further promise.
     */
    private fulfill( value: T ): void {
      this.state = State.Fulfilled;
      this.value = value;

      // Debug info
      if (plogger) {
        plogger.isSettled( this );
      }

      // Notify dependencies
      var dependencies = this.dependencies;
      u.schedule( PromisePriority, function() {
        for (var i = 0, l = dependencies.length; i < l; ++i) {
          dependencies[i].onFulfilled( value );
        }
      }, this );

      // Notify observers
      this.sendNext( value );

      // Clean up
      delete this.dependencies;
      this.sendCompleted();
      u.schedule( DroppedPriority, this.ondropped.sendCompleted, this.ondropped );
    }

    /*----------------------------------------------------------------
     * Rejects the promise with specified reason.
     */
    reject( reason?: any ): void {
      if (this.open) {
        this.rejectFirst( reason );
      }
    }

    private rejectFirst( reason: any ): void {
      if (this.state === State.Pending) {
        this.state = State.Rejected;
        this.reason = reason;
        delete this.value;

        // Debug info
        if (plogger) {
          plogger.isSettled( this );
        }

        // Notify dependencies
        var dependencies = this.dependencies;
        u.schedule( PromisePriority, function() {
          for (var i = 0, l = dependencies.length; i < l; ++i) {
            dependencies[i].onRejected( reason );
          }
        }, this );

        // Notify observers
        this.sendError( reason );

        // Clean up
        delete this.dependencies;
        this.sendCompleted();
        u.schedule( DroppedPriority, this.ondropped.sendCompleted, this.ondropped );
      }
    }

    /*----------------------------------------------------------------
     * Called once promise has been resolved to notify dependency.
     */
    private dischargeDependency( binding: Dependency<T,any> ) {
      if (this.state === State.Fulfilled) {
        binding.onFulfilled( this.value );
      }
      else if (this.state === State.Rejected) {
        binding.onRejected( this.reason );
      }
    }

    /*----------------------------------------------------------------
     * Sends a progress value to all dependencies.
     *
     * This is basically an event: if you're not subscribed when it
     * fires then you just don't get it.
     */
    notify( value: T ): void {
      if (this.open) {
        this.notifyFirst( value );
      }
    }

    private notifyFirst( value: T ): void {
      if (this.state == State.Pending) {
        this.value = value;
        // Notify dependencies
        var dependencies = this.dependencies;
        u.schedule( PromisePriority, function() {
          for (var i = 0, l = dependencies.length; i < l; ++i) {
            dependencies[i].onProgress( value );
          }
        }, this );

        // Notify observers
        this.sendNext( value );
      }
    }

    /*----------------------------------------------------------------
     * Chaining based approach to adding dependencies.
     *
     * Creates a new dependency; returns a promise for that
     * dependency's value.
     */
    then<U>( onFulfilled?: (value: T) => U,
             onRejected?: (reason: any) => U,
             onProgress?: (value: T) => void  ): Promise<U>;

    then<U>( onFulfilled?: (value: T) => Promise<U>,
             onRejected?: (reason: any) => U,
             onProgress?: (value: T) => void  ): Promise<U>;

    then<U>( onFulfilled?: (value: T) => U,
             onRejected?: (reason: any) => Promise<U>,
             onProgress?: (value: T) => void  ): Promise<U>;

    then<U>( onFulfilled?: (value: T) => Promise<U>,
             onRejected?: (reason: any) => Promise<U>,
             onProgress?: (value: T) => void  ): Promise<U>;

    then<U>( onFulfilled?: any,
             onRejected?: any,
             onProgress?: any
           ) {
      if (typeof onFulfilled !== 'function') { onFulfilled = null; }
      if (typeof onRejected  !== 'function') { onRejected  = null; }
      if (typeof onProgress  !== 'function') { onProgress  = null; }
      if (onFulfilled || onRejected || onProgress) {
        var p = new Promise<U>();
        this.bindDependency( p,
                             null,
                             onFulfilled,
                             onRejected,
                             onProgress
                           );
        return p;
      }
      else {
        return <any>this;
      }
    }

    /*----------------------------------------------------------------
     * Chaining based approach to dependencies.
     *
     * Creates a new dependency with the specified onRejected
     * callback; returns a promise for that dependency's value.
     */
    catch<U>( onRejected: (reason: any) => U ): Promise<U>;

    catch<U>( onRejected: (reason: any) => Promise<U> ): Promise<U>;

    catch<U>( onRejected: any ) {
      if (typeof onRejected === 'function') {
        var p = new Promise<U>();
        this.bindDependency( p, null, null, onRejected, null );
        return p;
      }
      else {
        return <any>this;
      }
    }

    /*----------------------------------------------------------------
     * Chaining based approach to dependencies.
     *
     * Creates a new dependency with the specified onProgress
     * callback; returns a promise for that dependency's value.
     */
    progress( onProgress: (value: T) => void ) {
      if (typeof onProgress === 'function') {
        var p = new Promise<T>();
        this.bindDependency( p, null, null, null, onProgress );
        return p;
      }
      else {
        return this;
      }
    }

    /*----------------------------------------------------------------
     * Dependency callbacks (defined below).
     *
     * Subscribing one promise to a second promise just means that
     * when the second promise resolves, the first promise also
     * resolves in the same way.
     */

    onFulfilled: (value: T) => void;

    onRejected: (reason: any) => void;

    onProgress: (value: T) => void;

    onNext: ( dependency: Dependency<T,any> ) => void;

    onError() { }

    onCompleted() { }

    /*----------------------------------------------------------------
     */
    static all( ...promises: Promise<any>[] ): Promise<any[]>;
    static all() {
      if (arguments.length) {
        var final = new Promise<any[]>();
        var values: any[] = [];
        var count = 0;
        var length = arguments.length;
        var update = function( i: number, v: any ) {
          values[i] = v;
          if (++count == length) {
            final.resolve( values );
          }
        };
        for (var i = 0; i < arguments.length; ++i) {
          signup( arguments[i], i, update );
        }
      }
      else {
        var final = new Promise<any[]>( [] );
      }

      return final;
    }
  }

  Promise.prototype.onFulfilled = (<any>Promise.prototype).resolveFirst;

  Promise.prototype.onRejected = (<any>Promise.prototype).rejectFirst;

  Promise.prototype.onProgress = (<any>Promise.prototype).notifyFirst;

  Promise.prototype.onNext = Promise.prototype.removeDependency;

  // Inherited empty dependency list
  Promise.prototype['dependencies'] = [];

  /*================================================================--
   * Add a callback to f to promise p.
   */
  function signup( p: Promise<any>, i: number, f: Function ) {
    p.then( function( v: any ) {
      f( i, v );
    } )
  }

  /*==================================================================
   * Function to call a handler on a dependency.
   */
  function callHandler( handler: Function,
                        dependency: Object,
                        value: any,
                        id: any,
                        promise: Promise<any>
                      ) {
    try {
      var result = handler.call( dependency, value, id );
      if (promise) {
        promise.resolve( result );
      }
    }
    catch (e) {
      console.warn( e );
      if (promise) {
        promise.reject( e );
      }
    }
  }
}