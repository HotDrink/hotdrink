 /*####################################################################
 * Defines PromiseLadder, which converts a sequence of promises into
 * a single observable.
 */
module hd.reactive {

  /*==================================================================
   * Converts a sequence of promises into a single observable by
   * firing on fulfilled promises only if no more recent promises
   * have fulfilled.  So, once a promise is fulfilled, any older
   * promises are dropped.
   */
  export class PromiseLadder<T> extends BasicObservable<T> {

    // The promises of the ladder, in order from least to most recent
    private promises: Promise<T>[];

    constructor( init: T ) {
      super();
      this.promises = [new Promise<T>( init )];
    }

    /*----------------------------------------------------------------
     * Are there any pending promises on the ladder?
     */
    isSettled() {
      return this.promises.length == 1 && this.promises[0].isSettled();
    }

    /*----------------------------------------------------------------
     */
    isCurrent() {
      return this.promises[this.promises.length - 1].isFulfilled();
    }

    /*----------------------------------------------------------------
     * Get the most recent promise on the ladder.
     */
    currentPromise() {
      return this.promises[this.promises.length - 1];
    }

    /*----------------------------------------------------------------
     * Add new promises to the ladder.
     */
    addPromise( promise: Promise<T> ) {
      this.promises.push( promise );

      if (promise instanceof Promise) {
        promise.addDependency( this,
                               this.onPromiseFulfilled,
                               this.onPromiseRejected,
                               this.onPromiseProgress,
                               promise
                             );
      }
      else {
        var ladder = this;
        promise.then(
          function( value: T )    { ladder.onPromiseFulfilled( value, promise ); },
          function( reason: any ) { ladder.onPromiseRejected( reason, promise ); },
          function( value: T )    { ladder.onPromiseProgress( value, promise );  }
        );
      }
    }

    /*----------------------------------------------------------------
     * If promise is on ladder, then unsubscribe/drop all promises
     * beneath it.  Returns true if promise was on the ladder, false
     * if it was not.
     */
    private
    selectPromise( promise: Promise<T> ): boolean {
      var i = this.promises.indexOf( promise );
      if (i < 0) { return false; }

      // unsubscribe from older promises
      for (var j = 0; j < i; ++j) {
        var p = this.promises[j];
        if (p instanceof Promise) {
          p.removeDependency( this );
        }
      }
      // remove all promises up to, but not including, this one
      if (i > 0) {
        this.promises.splice( 0, i );
      }

      return true;
    }

    /*----------------------------------------------------------------
     * Drop older promises; pass along the value.
     */
    private
    onPromiseFulfilled( value: T, promise: Promise<T> ) {
      if (this.selectPromise( promise )) {
        this.sendNext( value );
      }
    }

    /*----------------------------------------------------------------
     * Drop older promises; pass along the error
     */
    private
    onPromiseRejected( reason: any, promise: Promise<T> ) {
      if (this.selectPromise( promise )) {
        this.sendError( reason );
      }
    }

    /*----------------------------------------------------------------
     * Drop older promises; pass along the value.
     */
    private
    onPromiseProgress( value: T, promise: Promise<T> ) {
      if (this.selectPromise( promise )) {
        this.sendNext( value );
      }
    }

  }

}