/*####################################################################
 * The Variable class
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  export
  enum VariableEventType { changed, touched, pending, settled, setOutput }

  export
  interface VariableEvent {
    type: VariableEventType;
    vv: Variable;
    isOutput?: boolean;
  }

  /*==================================================================
   * Variable in the property model.
   */
  export
  class Variable {

    // Unique identifier
    id: string;

    // Human readable name for programmer
    name: string;

    // Value
    value : r.ObservableProperty<any>;

    // Is this an output variable?
    output : r.ObservableProperty<boolean>;

    // Error associated with this variable
    error = new r.ObservableProperty<any>( null );

    // Is value stale?
    stale = new r.ObservableProperty( false, u.doubleEqual );

    // Is the variable a source?
    source = new r.ObservableProperty( false, u.doubleEqual );

    // Is the variable pending?
    pending = new r.ObservableProperty( false, u.doubleEqual );

    // Is the variable contributing to an output?
    contributing = new r.ObservableProperty( u.Fuzzy.Yes, u.doubleEqual );

    // Could the variable contribute to an output if edited?
    relevant = new r.ObservableProperty( u.Fuzzy.Yes, u.doubleEqual );

    // Publishes events when value is touched or changed
    changes = new r.BasicObservable<VariableEvent>();

    // Promise waiting to be assigned
    private
    staged: r.Promise<any> = null;

    // Any pending promises made for the variable
    private
    ladder: r.PromiseLadder<any>;

    /*----------------------------------------------------------------
     * Initialize members.  Optional EqualityPredicate is used to
     * determine when value has changed.
     */
    constructor( id: string,
                 name: string,
                 value: any,
                 eq?: u.EqualityPredicate<any>,
                 output?: boolean               ) {
      this.id = id;
      this.name = name;

      this.value = new r.ObservableProperty( undefined, eq );
      this.output = new r.ObservableProperty( !! output, u.doubleEqual );
      this.ladder = new r.PromiseLadder<any>();

      // connect ladder to value
      this.ladder.addObserver( this,
                               this.onLadderNext,
                               this.onLadderError,
                               null
                             );

      if (value !== undefined) {
        var p: r.Promise<any>;
        if (value instanceof r.Promise) {
          p = <r.Promise<any>>value;
        }
        else {
          p = new r.Promise<any>();
          if (r.plogger) {
            r.plogger.register( p, this.name, "variable initialization" );
          }
          p.resolve( value );
        }
        this.makePromise( p );
      }
    }

    /*----------------------------------------------------------------
     * Human readable name
     */
    toString(): string {
      return this.name;
    }

    /*----------------------------------------------------------------
     * Set output property and generate change event
     */
    setOutput( isOutput: boolean ) {
      isOutput = !! isOutput;
      if (!this.output.hasValue( isOutput )) {
        this.output.set( isOutput );
        this.changes.sendNext( {type: VariableEventType.setOutput,
                                vv: this,
                                isOutput: isOutput}
                             );
      }
    }

    /*----------------------------------------------------------------
     * Make a promise to set the variable's value later.
     *
     * Broken into two stages:  make the promise, then commit the
     * promise.
     */
    makePromise( promise: r.Promise<any> ) {
      if (! (promise instanceof r.Promise)) {
        var value: any = promise;
        promise = new r.Promise<any>();
        if (r.plogger) {
          r.plogger.register( promise, this.name, 'variable update' );
        }
        promise.resolve( value );
      }
      this.staged = promise;
    }

    commitPromise() {
      if (this.staged) {
        this.ladder.addPromise( this.staged );
        this.staged = null;
        if (this.pending.get() == false) {
          this.pending.set( true );
          this.stale.set( false );
          this.changes.sendNext( {type: VariableEventType.pending, vv: this} );
        }
      }
    }

    /*----------------------------------------------------------------
     * Get pending promise if there is one; current promise otherwise.
     */
    getStagedPromise(): r.Promise<any> {
      return this.staged || this.ladder.getCurrentPromise();
    }

    /*----------------------------------------------------------------
     * Get a promise for the variable's value (ignoring pending).
     */
    getCurrentPromise(): r.Promise<any> {
      return this.ladder.getCurrentPromise();
    }

    /*----------------------------------------------------------------
     * Get a promise to be forwarded with the current variable value
     * (ignoring pending).
     */
    getForwardedPromise(): r.Promise<any> {
      var p = new r.Promise<any>();
      if (r.plogger) {
        r.plogger.register( p, this.name + '#fwd', ' forwarded' );
      }
      this.ladder.forwardPromise( p );
      return p;
    }

    /*----------------------------------------------------------------
     * Observer: subscribing to a variable == subscribing to its value
     */
    addObserver() {
      return this.value.addObserver.apply( this.value, arguments );
    }

    /*----------------------------------------------------------------
     * Observer: subscribing to a variable == subscribing to its value
     */
    removeObserver( observer: r.Observer<any> ): boolean {
      return this.value.removeObserver( observer );
    }

    /*----------------------------------------------------------------
     * Observable: widget produces a value
     */
    onNext( value: any ): void {
      this.makePromise( value );
      this.changes.sendNext( {type: VariableEventType.changed, vv: this} );
    }

    /*----------------------------------------------------------------
     * Observable: widget produces an error
     */
    onError( error: any ): void {
      var p = new r.Promise();
      if (r.plogger) {
        r.plogger.register( p, this.name, 'variable update' );
      }
      p.reject( error );
      this.makePromise( p );
      this.changes.sendNext( {type: VariableEventType.changed, vv: this} );
    }

    /*----------------------------------------------------------------
     * Observable: unused - don't care if widget completes
     */
    onCompleted(): void {
      // No-op
    }

    /*----------------------------------------------------------------
     * Ladder produced a good value.
     */
    onLadderNext( value: any ) {
      this.value.set( value );
      this.error.set( null );
      this.stale.set( this.ladder.currentFailed() );
      if (this.ladder.isSettled()) {
        this.pending.set( false );
        this.changes.sendNext( {type: VariableEventType.settled, vv: this} );
      }
    }

    /*----------------------------------------------------------------
     * Ladder produced an error.
     */
    onLadderError( error: any ) {
      if (error !== null) {
        this.error.set( error );
      }
      this.stale.set( this.ladder.currentFailed() );
      if (this.ladder.isSettled()) {
        this.pending.set( false );
        this.changes.sendNext( {type: VariableEventType.settled, vv: this} );
      }
    }

  }

}