 /*####################################################################
 * Defines PromiseLadder, which converts a sequence of promises into
 * a single observable.
 */
module hd.reactive {

  import u = hd.utility;

  /*==================================================================
   * Used to assign blame for failure to original source
   */
  export
  class Blame {
    promises: Promise<any>[];

    constructor( ...ps: (Promise<any>|Blame)[] );
    constructor( ps: (Promise<any>|Blame)[] );
    constructor() {
      var init: (Promise<any>|Blame)[];
      if (Array.isArray( arguments[0] )) {
        init = arguments[0];
      }
      else {
        init = <any>arguments;
      }
      this.promises = [];
      for (var i = 0, l = init.length; i < l; ++i) {
        if (init[i] instanceof Blame) {
          this.promises.push.apply( this.promises, (<Blame>init[i]).promises );
        }
        else {
          this.promises.push( <Promise<any>>init[i] );
        }
      }
    }
  }

  /*==================================================================
   * Record type used to keep track of a forwarded promise
   */
  interface Forward<T> {
    promise: Promise<T>;
    dependencies: u.ArraySet<Promise<any>>;
  }

  /*==================================================================
   * Everything to remember about one promise
   */
  interface LadderEntry<T> {
    promise: Promise<T>;
    state: string;
    value?: T;
    reason?: any;
    blame?: Blame;
    forwards?: Foward<T>[];
  }

  /*==================================================================
   * Converts a sequence of promises into a single observable by
   * firing on fulfilled promises only if no more recent promises
   * have fulfilled.  So, once a promise is fulfilled, any older
   * promises are dropped.
   *
   * Invariant:  entries[0].state == 'fulfilled'
   */
  export
  class PromiseLadder<T> extends BasicObservable<T> {

    private
    entries: LadderEntry<T>;

    /*----------------------------------------------------------------
     * Initialize
     */
    constructor( init: T ) {
      super();
      this.entries = [{promise: new Promise( init ),
                       state: 'fulfilled',
                       value: init
                      }
                     ];
    }

    /*----------------------------------------------------------------
     * Is there any possibility the value will change?
     */
    isSettled() {
      var i = this.entries.length - 1;
      while (this.entries[i].state === 'failed') {
        --i;
      }
      return this.promises[i].state !== 'pending';
    }

    /*----------------------------------------------------------------
     * Get the most recent promise on the ladder.
     */
    getCurrentPromise() {
      return this.promises[this.promises.length - 1];
    }

    /*----------------------------------------------------------------
     * Get a promise forwarded from most recent promise
     */
    getForwardedPromise( dependencies?: u.ArraySet<Promise<any>> ) {
      var last = this.promises.length - 1;
      var promise = new Promise<T>();
      var forward: Forward<T> = {promise: promise, dependencies: dependencies};

      // Try to forward
      if (! this.tryToForward( forward, last )) {
        promise.ondropped.addObserver( this,
                                       this.onForwardDropped,
                                       null,
                                       null,
                                       this.promises[last]
                                     );
        // If fails, add to forward list
        if (! this.entries[last].forwards) {
          this.entries[last].forwards = [forward];
        }
        else {
          this.entries[last].forwards.push( forward );
        }
      }

      return promise;
    }

    /*----------------------------------------------------------------
     * Add new promises to the ladder.
     */
    addPromise( promise: Promise<T> ) {
      // Wrap alternate promise types in our own promise
      if (! (promise instanceof Promise)) {
        promise = new Promise<T>( <any>promise );
      }

      // Add promise
      this.promises.push( promise );

      // Subscribe
      promise.addDependency( this,
                             this.onPromiseFulfilled,
                             this.onPromiseRejected,
                             this.onPromiseProgress,
                             promise
                           );
    }

    /*----------------------------------------------------------------
     * Do work for fulfilled promise
     */
    private
    onPromiseFulfilled( value: T, promise: Promise<T> ) {
      var i = this.findPromiseIndex( promise );
      if (i >= 0) {
        this.entries[i].state = 'fulfilled';
        this.entries[k].value = value;

        // Try to find a more recent valued promise
        var j = i + 1, l = this.promises.length;
        while (j < l && (this.entries[j].state === 'pending' ||
                         this.entries[j].state === 'failed')   ) {
          ++j;
        }
        if (j == l) {
          // If none found, then this is the new ladder value
          this.sendNext( value );
        }

        this.updateForwardsStartingFrom( i );
      }
    }

    /*----------------------------------------------------------------
     * Do work for rejected promise
     */
    private
    onPromiseRejected( reason: any, promise: Promise<T> ) {
      var i = this.findPromiseIndex( promise );
      if (i >= 0) {
        if (reason instanceof Blame) {
          this.entries[i].state = 'failed';
          this.entries[i].blame = reason;
        }
        else {
          this.entries[i].state = 'rejected';
          this.entries[i].reason = reason;
        }

        // Try to find a more recent valued promise
        var j = i + 1, l = this.promises.length;
        while (j < l && (this.entries[j].state === 'failed' ||
                         this.entries[j].state === 'pending'  )   ) {
          ++j;
        }
        if (j == l) {
          // If none found, then this is the new ladder value
          this.sendError( reason );
        }
        this.updateForwardsStartingFrom( i );
      }
    }

    /*----------------------------------------------------------------
     * Same as onPromiseFulfilled except no change to state
     */
    private
    onPromiseProgress( value: T, promise: Promise<T> ) {
      var i = this.findPromiseIndex( promise );
      if (i >= 0) {
        this.entries[k].value = value;

        // Try to find a more recent valued promise
        var j = i + 1, l = this.promises.length;
        while (j < l && (this.entries[j].state === 'pending' ||
                         this.entries[j].state === 'failed')   ) {
          ++j;
        }
        if (j == l) {
          // If none found, then this is the new ladder value
          this.sendNext( value );
        }

        this.updateForwardsStartingFrom( i );
      }
    }

    /*----------------------------------------------------------------
     * Forwarded promise no longer needed
     */
    private
    onForwardDropped( forwardedPromise: Promise<T>, promise: Promise<T> ) {
      var i = this.findPromiseIndex( promise );
      var forwards;
      if (i >= 0 && (forwards = this.entries[i].forwards)) {
        var j = forwards.indexOf( forwardedPromise );
        if (j >= 0) {
          if (forwards.length == 1) {
            this.entries[i].forwards = undefined;
            this.dropUnneededPromises();
          }
          else {
            forwards.splice( j, 1 );
          }
        }
      }
    }

    /*----------------------------------------------------------------
     * Try to perform all forwards starting at index i and continuing
     * up as long as promises were failed.
     */
    private
    updateForwardsStartingFrom( i: number ) {

        // Try to perform all forwards for this promise
        this.tryToForwardList( i, i );

        // Try to perform any forwards for more recent promises that have failed
        for (var j = i + 1, l = this.entries.length;
             j < l && this.entries[j].state === 'failed'; ++j) {
          this.tryToForwardList( j, i );
        }

        // Clean up
        this.dropUnneededPromises();
    }

    /*----------------------------------------------------------------
     * Try to forward each promise on the list.  Returns list of
     * promises which could /not/ be forwarded.
     */
    private
    tryToForwardList( target: number, start: number ) {
      var forwards = this.entries[target].forwards;

      if (forwards) {
        var remaining: Forward<T>[] = [];
        for (var i = 0, l = forwards.length; i < l; ++i) {
          if (! this.tryToForward( forwards[i], start )) {
            remaining.push( forwards[i] );
          }
        }

        this.forwardLists[listNum] = remaining.length == 0 ? undefined : remaining;
      }
    }

    /*----------------------------------------------------------------
     * Try to settle forward using this.promises[i].  Returns true iff
     * forward was settled.
     */
    private
    tryToForward( forward: Forward<T>, i: number ): boolean {
      var entry = this.entries[i];

      if (entry.state === 'fulfilled') {
        forward.promise.resolve( entry.value );
        return true;
      }

      if (entries.state === 'rejected') {
        forward.promise.reject( entry.reason );
        return true;
      }

      if (entries.state === 'failed') {
        var rejectedDependencies =
              u.arraySet.intersect( entries.blame.promises, forward.dependencies );
        if (rejectedDependencies.length > 0) {
          forward.promise.reject( new Blame( rejectedDependencies ) );
          return true;
        }
        else {
          return this.tryToForward( forward, i - 1 );
        }
      }

      if (entries.state === 'pending' && 'value' in status) {
        forward.promise.notify( status.value );
      }
      return false;
    }

    /*----------------------------------------------------------------
     * Drop all promises which are settled or which can no longer
     * affect the ladder value and have no forwards.
     */
    private
    dropUnneededPromises() {
      // The bottom of the list must always be a fulfilled promise,
      //   so keep track of the last one we encounter
      var last = 0;
      var i = 1, l = this.promises.length;
      while (i < l && (! this.promises[i].isPending() || ! this.forwardLists[i])) {
        if (this.promises[i].isFulfilled()) {
          last = i;
        }
        ++i;
      }

      // See if there are promises to be dropped
      if (last > 0) {
        // Unsubscribe from any we may still be subscribed to
        for (var j = 0; j < last; ++j) {
          var p = this.promises[j];
          if (p.isPending()) {
            p.ondropped.removeObserver( this );
            p.removeDependency( this );
          }
        }
        // And drop them
        this.promises.splice( 0, last );
        this.forwardLists.splice( 0, last );
      }
    }

  }

  (<any>PromiseLadder.prototype).onPromiseProgress = (<any>PromiseLadder.prototype).onPromiseFulfilled;
}