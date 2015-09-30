/*####################################################################
 * The Signal class.
 */
module hd.reactive {

  import u = hd.utility;

  export interface Signal<T> extends Observable<T> {
    get(): T;
    addObserverChangesOnly( observer: Observer<T> ): Observer<T>;
  }

  export interface ProxySignal<T> extends ProxyObservable<T> {
    get(): T;
    addObserverChangesOnly( observer: Observer<T> ): Observer<T>;
    addObserverChangesOnly( object: Object,
                            onNext: (value: T) => void,
                            onError: (error: any) => void,
                            onCompleted: () => void        ): Observer<T>;
    addObserverChangesOnly<U>( object: Object,
                               onNext: (value: T, id?: U) => void,
                               onError: (error: any, id?: U) => void,
                               onCompleted: (id?: U) => void,
                               id: U                                  ): Observer<T>;
  }

  export
  var SignalPriority = 3;

  enum Scheduled { None, Init, Update };

  export class BasicSignal<T> extends BasicObservable<T> {
    value: T;
    eq: u.EqualityPredicate<T>;

    constructor( value?: T, eq?: u.EqualityPredicate<T> ) {
      super();
      this.value = value;
      if (eq) {
        this.eq = eq;
      }
    }

    /*----------------------------------------------------------------
     * On subscribing, automatically sends "next" notification with
     * current value.
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
      var added: Observer<T>;
      if (arguments.length === 1) {
        added = super.addObserver( <Observer<T>>object );
      }
      else {
        added = super.addObserver( object, onNext, onError, onCompleted, id );
      }
      if (added && this.value !== undefined) {
        added.onNext( this.value );
      }
      return added;
    }

    /*----------------------------------------------------------------
     * On subscribing, automatically sends "next" notification with
     * current value.
     */
    addObserverChangesOnly( observer: Observer<T> ): Observer<T>;
    addObserverChangesOnly( object: Object,
                            onNext: (value: T) => void,
                            onError: (error: any) => void,
                            onCompleted: () => void        ): Observer<T>;
    addObserverChangesOnly<U>( object: Object,
                               onNext: (value: T, id?: U) => void,
                               onError: (error: any, id?: U) => void,
                               onCompleted: (id?: U) => void,
                               id: U                                  ): Observer<T>;
    addObserverChangesOnly( object: Object,
                            onNext?: (value: T, id?: any) => void,
                            onError?: (error: any, id?: any) => void,
                            onCompleted?: (id?: any) => void,
                            id?: any                                  ): Observer<T> {
      var added: Observer<T>;
      if (arguments.length === 1) {
        added = super.addObserver( <Observer<T>>object );
      }
      else {
        added = super.addObserver( object, onNext, onError, onCompleted, id );
      }
      return added;
    }

    /*----------------------------------------------------------------
     * Setter.  Sends a "next" notification if the value has changed.
     */
    set( value: T ) {
      if (! this.hasValue( value )) {
        this.value = value;
        this.sendNext( value );
      }
    }

    /*----------------------------------------------------------------
     * Getter.
     */
    get(): T {
      return this.value;
    }

    /*----------------------------------------------------------------
     * Comparison.
     */
    hasValue( value: T ): boolean {
      if (this.eq) {
        return this.eq( this.value, value );
      }
      else {
        return this.value === undefined && value === undefined;
      }
    }

  }


  /*==================================================================
   * An observable value that belongs to an object.
   */
  export class ScheduledSignal<T> extends BasicObservable<T> {

    // The value of the signal
    private value: T;

    private lastUpdate: T;

    // Test to see whether two values are equal
    // (used to determine when the value has changed)
    private eq: u.EqualityPredicate<T>;

    // Is there an update currently scheduled?
    private scheduled = Scheduled.None;

    private needInit: Observer<T>[] = null;

    /*----------------------------------------------------------------
     * Initialize properties
     */
    constructor( value?: T, eq?: u.EqualityPredicate<T> ) {
      super();
      this.value = value;
      if (eq) {
        this.eq = eq;
      }
    }

    /*----------------------------------------------------------------
     * Used to schedule an "onNext" notification for either an
     * individual observer or else all observers.
     */
    private scheduleUpdate() {
      if (this.scheduled === Scheduled.None) {
        this.scheduled = Scheduled.Update;
        u.schedule( SignalPriority, this.update, this );
      }
      else {
        this.scheduled = Scheduled.Update;
      }
    }

    private scheduleInit( observer: Observer<T> ) {
      if (this.needInit) {
        this.needInit.push( observer );
      }
      else {
        this.needInit = [observer];
      }
      if (this.scheduled === Scheduled.None) {
        this.scheduled = Scheduled.Init;
        u.schedule( SignalPriority, this.update, this );
      }
    }

    /*----------------------------------------------------------------
     * Sends "onNext" notification to some or all observers.
     */
    private update() {
      // In case callbacks should modify this signal, we store these locally and reset them
      var scheduled = this.scheduled;
      this.scheduled = Scheduled.None;
      var init = this.needInit;
      this.needInit = null;

      if (scheduled === Scheduled.Update) {
        if (this.hasValue( this.lastUpdate )) {
          scheduled = Scheduled.Init;
        }
        else {
          this.lastUpdate = this.value;
          this.sendNext( this.value );
        }
      }

      if (scheduled === Scheduled.Init && init) {
        init.forEach( function( observer: Observer<T> ) {
          u.schedule( ObservablePriority, observer.onNext, observer, this.value );
        }, this );
      }
    }

    /*----------------------------------------------------------------
     * On subscribing, automatically sends "next" notification with
     * current value.
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
      var added: Observer<T>;
      if (arguments.length === 1) {
        added = super.addObserver( <Observer<T>>object );
      }
      else {
        added = super.addObserver( object, onNext, onError, onCompleted, id );
      }
      if (added && this.value !== undefined) {
        this.scheduleInit( added );
      }
      return added;
    }

    /*----------------------------------------------------------------
     * On subscribing, automatically sends "next" notification with
     * current value.
     */
    addObserverChangesOnly( observer: Observer<T> ): Observer<T>;
    addObserverChangesOnly( object: Object,
                            onNext: (value: T) => void,
                            onError: (error: any) => void,
                            onCompleted: () => void        ): Observer<T>;
    addObserverChangesOnly<U>( object: Object,
                               onNext: (value: T, id?: U) => void,
                               onError: (error: any, id?: U) => void,
                               onCompleted: (id?: U) => void,
                               id: U                                  ): Observer<T>;
    addObserverChangesOnly( object: Object,
                            onNext?: (value: T, id?: any) => void,
                            onError?: (error: any, id?: any) => void,
                            onCompleted?: (id?: any) => void,
                            id?: any                                  ): Observer<T> {
      var added: Observer<T>;
      if (arguments.length === 1) {
        added = super.addObserver( <Observer<T>>object );
      }
      else {
        added = super.addObserver( object, onNext, onError, onCompleted, id );
      }
      return added;
    }

    /*----------------------------------------------------------------
     * Setter.  Sends a "next" notification if the value has changed.
     */
    set( value: T ) {
      if (! this.hasValue( value )) {
        this.value = value;
        this.scheduleUpdate();
      }
    }

    /*----------------------------------------------------------------
     * Getter.
     */
    get(): T {
      return this.value;
    }

    /*----------------------------------------------------------------
     * Comparison.
     */
    hasValue( value: T ): boolean {
      if (this.eq) {
        return this.eq( this.value, value );
      }
      else {
        return false;
      }
    }

  }

}
