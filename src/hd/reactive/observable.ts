/*####################################################################
 * Interfaces related to Observable design pattern.
 */
module hd.reactive {

  import u = hd.utility;

  export var ObservablePriority = -1;

  /*==================================================================
   * An object which observes values.
   */
  export interface Observer<T> {
    onNext( value: T ): void;
    onError( error: any ): void;
    onCompleted(): void;
  }

  /*==================================================================
   * An object which produces values.
   */
  export interface Observable<T> {
    addObserver( observer: Observer<T> ): void;
    removeObserver( observer: Observer<T> ): void;
  }

  export interface ProxyObservable<T> extends Observable<T> {
    addObserver( observer: Observer<T> ): Observer<T>;
    addObserver( object: Object,
                 onNext: (value: T) => void,
                 onError: (error: any) => void,
                 onCompleted: () => void        ): Observer<T>;
    addObserver<U>( object: Object,
                    onNext: (value: T, id?: U) => void,
                    onError: (error: any, id?: U) => void,
                    onCompleted: (id?: U) => void,
                    id: U                                  ): Observer<T>;
    removeObserver( observer: Object ): void;
  }

  /*==================================================================
   */
  export
  class ProxyObserver<T> {

    constructor( public object: Object,
                 public next_cb: (value: T, id?: any) => void,
                 public error_cb: (error: any, id?: any) => void,
                 public completed_cb: (id?: any) => void,
                 public id: any                                   ) { }

    onNext( value: T ) {
      if (this.next_cb) {
        this.next_cb.call( this.object, value, this.id );
      }
    }

    onError( error: any ) {
      if (this.error_cb) {
        this.error_cb.call( this.object, error, this.id );
      }
    }

    onCompleted() {
      if (this.completed_cb) {
        this.completed_cb.call( this.object, this.id );
      }
    }
  }

  /*==================================================================
   * Straightforward implementation of Observable.
   */
  export class BasicObservable<T> {

    // List of observers
    // (Note: inherits empty list from prototype; copies on write)
    '#observers': Observer<T>[];

    /*----------------------------------------------------------------
     * Predicate to tell if anyone's listening
     */
    hasObservers(): boolean {
      return this['#observers'].length > 0
    }

    /*----------------------------------------------------------------
     * Subscribe observer.
     */
    addObserver( observer: Observer<T> ): Observer<T>;
    addObserver( object: Object,
                 onNext: (value: T) => void,
                 onError: (error: any) => void,
                 onCompleted: () => void        ): Observer<T>;
    addObserver<U>( object: Object,
                    onNext: (value: T, id?: U) => void,
                    onError: (error: any, id?: U) => void,
                    onCompleted: (id?: U) => void,
                    id: U                                  ): Observer<T>;
    addObserver( object: Object,
                 onNext?: (value: T, id?: any) => void,
                 onError?: (error: any, id?: any) => void,
                 onCompleted?: (id?: any) => void,
                 id?: any                                  ): Observer<T> {
      var observer: Observer<T>;
      if (arguments.length == 1) {
        observer = <Observer<T>>object;
      }
      else {
        observer = new ProxyObserver( object, onNext, onError, onCompleted, id );
      }
      if (this.hasOwnProperty( '#observers' )) {
        this['#observers'].push( observer );
      }
      else {
        // copy on write
        this['#observers'] = [observer];
      }
      return observer;
    }

    /*----------------------------------------------------------------
     * Cancel subscription by a particular observer.
     */
    removeObserver( observer: Object ): boolean {
      var removed = false;
      for (var i = this['#observers'].length; i >= 0; --i) {
        var o = this['#observers'][i];
        if (o === observer ||
            (o instanceof ProxyObserver &&
             (<ProxyObserver<T>>o).object === observer)) {
          this['#observers'].splice( i, 1 );
          removed = true;
        }
      }
      return removed;
    }

    /*----------------------------------------------------------------
     * Send "next" event to all observers.
     */
    sendNext( value: T ): void {
      this['#observers'].slice( 0 ).forEach( function( observer: Observer<T> ) {
        observer.onNext( value );
        //u.schedule( ObservablePriority, observer.onNext, observer, value );
      } );
    }

    /*----------------------------------------------------------------
     * Send "error" event to all observers.
     */
    sendError( error: any ): void {
      this['#observers'].slice( 0 ).forEach( function( observer: Observer<T> ) {
        observer.onError( error );
        //u.schedule( ObservablePriority, observer.onError, observer, error );
      } );
    }

    /*----------------------------------------------------------------
     * Send "completed" event to all observers.
     */
    sendCompleted(): void {
      this['#observers'].slice( 0 ).forEach( function( observer: Observer<T> ) {
        observer.onCompleted();
        //u.schedule( ObservablePriority, observer.onCompleted, observer );
      } );
      delete this['#observers'];
    }

  }

  // Inherited empty observer list
  BasicObservable.prototype['#observers'] = [];


  /*==================================================================
   * Combine list of ovservables into a single observable
   */
  export class Union<T> extends BasicObservable<T> {

    // Number of observables being combined
    count: number;

    // Number of observables completed
    completedCount = 0;

    /*----------------------------------------------------------------
     * Watch everything
     */
    constructor( sources: Observable<T>[] ) {
      super();
      this.count = sources.length;

      sources.forEach( function( obs: Observable<T> ) {
        obs.addObserver( this );
      } );
    }

    /*----------------------------------------------------------------
     * Pass along.
     */
    onNext( value: T ) {
      this.sendNext( value );
    }

    /*----------------------------------------------------------------
     * Pass along.
     */
    onError( error: any ) {
      this.sendError( error );
    }

    /*----------------------------------------------------------------
     * Wait for the last; then pass along.
     */
    onCompleted() {
      if (++this.completedCount == this.count) {
        this.sendCompleted();
      }
    }
  }
}
