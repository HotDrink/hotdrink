/*####################################################################
 * The Variable class
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  export const
  enum VariableEventType { changed, touched, pending, settled, command }

  export
  interface VariableEvent {
    type: VariableEventType;
    vv: Variable;
    cmd?: Command;
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

    // Is the stay constraint created with max or min priority?
    optional: Optional = Optional.Min;

    // Value
    value : r.ScheduledSignal<any>;

    // Error associated with this variable
    error = new r.ScheduledSignal<any>( null );

    // Is value stale?
    stale = new r.ScheduledSignal( false, u.doubleEqual );

    // Is the variable a source?
    source = new r.ScheduledSignal( false, u.doubleEqual );

    // Is the variable pending?
    pending = new r.ScheduledSignal( false, u.doubleEqual );

    // Is the variable contributing to an output?
    contributing = new r.ScheduledSignal( u.Fuzzy.Yes, u.doubleEqual );

    // Could the variable contribute to an output if edited?
    relevant = new r.ScheduledSignal( u.Fuzzy.Yes, u.doubleEqual );

    // Publishes events when value is touched or changed
    changes = new r.BasicObservable<VariableEvent>();

    // Promise waiting to be assigned
    private
    staged: r.Promise<any> = null;

    // Any pending promises made for the variable
    private
    ladder: r.PromiseLadder<any>;

    private
    setCommand: Command;

    /*----------------------------------------------------------------
     * Initialize members.  Optional EqualityPredicate is used to
     * determine when value has changed.
     */
    constructor( name: string,
                 value?: any,
                 eq?: u.EqualityPredicate<any> ) {
      this.id = makeId( name );
      this.name = name;

      this.value = new r.ScheduledSignal( undefined, eq );
      this.ladder = new r.PromiseLadder<any>();

      // connect ladder to value
      this.ladder.addObserver( this,
                               this.onLadderNext,
                               this.onLadderError,
                               null
                             );

      if (value === undefined) {
        this.optional = Optional.Min;
      }
      else {
        this.optional = Optional.Max;
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

      this.setCommand = new Command( "set " + name, undefined, [], [], [this] );
    }

    /*----------------------------------------------------------------
     * Human readable name
     */
    toString(): string {
      return this.name;
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
     */
    get(): any {
      return this.value.get();
    }

    /*----------------------------------------------------------------
     */
    set( value: any ) {
      this.makePromise( value );
      this.changes.sendNext( {type: VariableEventType.changed, vv: this} );
    }

    /*----------------------------------------------------------------
     */
    commandSet( value: any ) {
      var cmd = Object.create( this.setCommand );
      cmd.result = value;
      this.changes.sendNext( {type: VariableEventType.command, vv: this, cmd: cmd} );
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
    onNext: ( value: any ) => void;

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

  Variable.prototype.onNext = Variable.prototype.commandSet;

}
