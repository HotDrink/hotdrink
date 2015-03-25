 /*####################################################################
 * Defines PromiseLadder, which converts a sequence of promises into
 * a single observable.
 */
module hd.reactive {

  import u = hd.utility;

  /*==================================================================
   * Everything to remember about one promise
   */
  interface LadderEntry<T> {
    promise: Promise<T>;
    state: string;
    value?: T;
    reason?: any;
    forwards?: Promise<T>[];
  }

  /*==================================================================
   * Converts a sequence of promises into a single observable by
   * firing on fulfilled promises only if no more recent promises
   * have fulfilled.  So, once a promise is fulfilled, any older
   * promises are dropped.
   *
   * Invariant:  entries[0].state == 'fulfilled' || entries[0].state == 'rejected'
   */
  export
  class PromiseLadder<T> extends BasicObservable<T> {

    private
    entries: LadderEntry<T>[];

    /*----------------------------------------------------------------
     * Initialize
     */
    constructor() {
      super();
      this.entries = [{promise: new Promise<T>( undefined ),
                       state: 'fulfilled',
                       value: undefined
                      }
                     ];
    }

    /*----------------------------------------------------------------
     * Is there any possibility the value will change (assuming no
     * further promises are added)?
     */
    isSettled() {
      var i = this.entries.length - 1;
      while (this.entries[i].state === 'failed') {
        --i;
      }
      return this.entries[i].state !== 'pending';
    }

    /*----------------------------------------------------------------
     * Get the most recent promise on the ladder.
     */
    getCurrentPromise() {
      return this.entries[this.entries.length - 1].promise;
    }

    /*----------------------------------------------------------------
     * Get a promise forwarded from most recent promise
     */
    getForwardedPromise() {
      var last = this.entries.length - 1;
      var forward = new Promise<T>();

      // Try to forward
      if (! this.tryToForward( forward, last )) {
        forward.ondropped.addObserver( this,
                                       this.onForwardDropped,
                                       null,
                                       null,
                                       this.entries[last].promise
                                     );
        // If fails, add to forward list
        if (! this.entries[last].forwards) {
          this.entries[last].forwards = [forward];
        }
        else {
          this.entries[last].forwards.push( forward );
        }
      }

      return forward;
    }

    /*----------------------------------------------------------------
     */
    private
    findPromiseIndex( p: Promise<T> ): number {
      for (var i = 0, l = this.entries.length; i < l; ++i) {
        if (this.entries[i].promise === p) {
          return i;
        }
      }
      return -1;
    }

    /*----------------------------------------------------------------
     * Find most recent entry to produce results.
     * "Results" means either fulfilled, rejected, or pending with a
     * notification.
     */
    private
    getMostRecent(): number {
      for (var i = this.entries.length - 1; i >= 0; --i) {
        var entry = this.entries[i];
        var state = entry.state;
        if (state === 'fulfilled' ||
            state === 'rejected' ||
            (state === 'pending' && 'value' in entry)) {
          break;
        }
      }
      return i;
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
      this.entries.push( {promise: promise, state: 'pending'} );

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
        this.entries[i].value = value;

        if (this.getMostRecent() == i) {
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
      var i = this.findPromiseIndex( promise );      if (i >= 0) {
        // Special case:  if this promise produced a pending value for the ladder,
        //                then failed, we must reproduce the most recent answer
        var letOlderAnswerPassThrough =
              (reason === undefined || reason === null) &&
              ('value' in this.entries[i]);

        if (reason === null || reason === undefined) {
          this.entries[i].state = 'failed';
        }
        else {
          this.entries[i].state = 'rejected';
          this.entries[i].reason = reason;
        }

        var mostRecent = this.getMostRecent();
        if (mostRecent == i) {
          this.sendError( reason );
        }
        else if (letOlderAnswerPassThrough && mostRecent < i) {
          var allFailed = true;
          for (var j = i - 1; j > mostRecent; --j) {
            if (this.entries[j].state !== 'failed') {
              allFailed = false;
            }
          }
          if (allFailed) {
            var entry = this.entries[mostRecent];
            if (entry.state === 'rejected') {
              this.sendNext( entry.reason );
            }
            else {
              this.sendNext( entry.value );
            }
          }
        }
        this.updateForwardsStartingFrom( i );
      }
    }

    /*----------------------------------------------------------------
     * Do work for promise notification
     */
    private
    onPromiseProgress( value: T, promise: Promise<T> ) {
      var i = this.findPromiseIndex( promise );
      if (i >= 0) {
        this.entries[i].value = value;

        if (this.getMostRecent() == i) {
          this.sendNext( value );
        }

        this.updateForwardsStartingFrom( i );
      }
    }

    /*----------------------------------------------------------------
     * Forwarded promise no longer needed
     */
    private
    onForwardDropped( forward: Promise<T>, promise: Promise<T> ) {
      var i = this.findPromiseIndex( promise );
      var forwards = this.entries[i].forwards;
      if (i >= 0 && forwards) {
        var j = forwards.indexOf( forward );
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
        var remaining: Promise<T>[] = [];
        for (var i = 0, l = forwards.length; i < l; ++i) {
          if (! this.tryToForward( forwards[i], start )) {
            remaining.push( forwards[i] );
          }
        }

        this.entries[target].forwards = remaining.length == 0 ? undefined : remaining;
      }
    }

    /*----------------------------------------------------------------
     * Try to settle forward using this.promises[i].  Returns true iff
     * forward was settled.
     */
    private
    tryToForward( forward: Promise<T>, i: number ): boolean {
      var entry = this.entries[i];

      if (entry.state === 'fulfilled') {
        forward.resolve( entry.value );
        return true;
      }

      if (entry.state === 'rejected') {
        forward.reject( entry.reason );
        return true;
      }

      if (entry.state === 'failed') {
        return this.tryToForward( forward, i - 1 );
      }

      if (entry.state === 'pending' && 'value' in entry) {
        forward.notify( entry.value );
      }
      return false;
    }

    /*----------------------------------------------------------------
     * Drop all promises which are settled or which can no longer
     * affect the ladder value and have no forwards.
     */
    private
    dropUnneededPromises() {
      var last = this.entries.length - 1;
      var removeAnswered = false;
      var removePending = false;
      for (var i = last; i >= 0; --i) {
        var entry = this.entries[i];
        var state = entry.state;
        if (state === 'fulfilled' || state === 'rejected') {
          if (removeAnswered) {
            this.entries.splice( i, 1 );
          }
          removeAnswered = true;
          removePending = true;
        }
        else {
          if (entry.forwards) {
            removeAnswered = false;
          }
          else if (state === 'failed') {
            if (i != last) {
              this.entries.splice( i, 1 );
            }
          }
          else if (state === 'pending') {
            if (removePending) {
              this.entries.splice( i, 1 );
            }
          }
        }
      }
    }

  }

}