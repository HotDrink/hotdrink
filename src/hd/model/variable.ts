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

    // Is the variable a source?
    source = new r.ObservableProperty( false );

    // Is the variable pending?
    pending = new r.ObservableProperty( false );

    // Is the variable contributing to an output?
    contributing = new r.ObservableProperty( u.Fuzzy.Yes );

    // Could the variable contribute to an output if edited?
    relevant = new r.ObservableProperty( u.Fuzzy.Yes );

    // Publishes events when value is touched or changed
    changes = new r.BasicObservable<VariableEvent>();

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

      this.value = new r.ObservableProperty( value, eq );
      this.output = new r.ObservableProperty( !! output );
      this.ladder = new r.PromiseLadder<any>( value );

      // connect ladder to value
      this.ladder.addObserver( this,
                               this.onLadderNext,
                               this.onLadderError,
                               null
                             );
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
     */
    makePromise( promise: r.Promise<any> ) {
      this.ladder.addPromise( promise );
      if (this.pending.get() == false) {
        this.pending.set( true );
        this.changes.sendNext( {type: VariableEventType.pending, vv: this} );
      }
    }

    /*----------------------------------------------------------------
     * Get a promise for the variable's value.
     */
    getPromise(): r.Promise<any> {
      return this.ladder.currentPromise();
    }

    /*----------------------------------------------------------------
     * Observer: subscribing to a variable == subscribing to its value
     */
    addObserver() {
      return this.value.addObserver.apply( this.value, arguments );
    }

    addObserverInit() {
      return this.value.addObserverInit.apply( this.value, arguments );
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
      if (this.ladder.isSettled() && this.value.hasValue( value )) {
        this.changes.sendNext( {type: VariableEventType.touched, vv: this} );
      }
      else {
        this.makePromise( new r.Promise( value ) );
        this.changes.sendNext( {type: VariableEventType.changed, vv: this} );
      }
    }

    /*----------------------------------------------------------------
     * Observable: widget produces an error
     */
    onError( error: any ): void {
      var p = new r.Promise();
      p.reject( error );
      this.makePromise( p );
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
      this.value.hardSet( value );
      this.error.set( null );
      if (this.ladder.isSettled()) {
        this.pending.set( false );
        this.changes.sendNext( {type: VariableEventType.settled, vv: this} );
      }
    }

    /*----------------------------------------------------------------
     * Ladder produced an error.
     */
    onLadderError( error: any ) {
      this.error.set( error );
      if (this.ladder.isSettled()) {
        this.pending.set( false );
        this.changes.sendNext( {type: VariableEventType.settled, vv: this} );
      }
    }

  }

}