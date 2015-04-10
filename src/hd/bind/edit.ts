/*####################################################################
 * Binding for a text input box.
 */

module hd.bindings {

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;

  var i = 0;

  var flush = new Object();

  /*================================================================
   * Observer/Observable for binding
   */
  export
  class Edit {

    // element bound to
    el: HTMLInputElement;

    // stabilizer
    stable: r.Stabilizer<any>;

    // value to change from on blur
    blurFrom: string = null;

    // value to change to on blur
    blurTo: string = null;

    // whether we've set at least one value
    initialized = false;

    /*----------------------------------------------------------------
     * Initialize and subscribe to HTML editing events.
     */
    constructor( el: HTMLElement, time_ms?: number ) {
      this.el = checkHtml( el, HTMLInputElement );
      this.stable = new r.Stabilizer( time_ms, flush );

      el.addEventListener( 'input', this.update.bind( this ) );
      el.addEventListener( 'change', this.onBlur.bind( this ) );
    }

    /*----------------------------------------------------------------
     */
    addObserver( o: r.Observer<any> ) {
      this.stable.addObserver.apply( this.stable, arguments );
    }

    /*----------------------------------------------------------------
     */
    removeObserver( o: r.Observer<any> ) {
      this.stable.removeObserver.apply( this.stable, arguments );
    }

    /*----------------------------------------------------------------
     * When widget is modified.
     */
    update() {
      this.initialized = true;
      this.stable.onNext( this.el.value );
    }

    /*----------------------------------------------------------------
     * When variable is modified.
     */
    onNext( value: string ) {
      if (value === undefined || value === null) {
        value = '';
      }
      else if (typeof value !== 'string') {
        value = value.toString();
      }

      // the basic idea here is this:  the value should not change as you
      // are editing; it should wait and change when you are through editing

      if (this.initialized && this.el === document.activeElement) {
        this.blurTo = value;
      }
      else
      {
        if (this.el.value != value) {
          this.el.value = value;
          if (this.el === document.activeElement) {
            this.el.select();
          }
        }
        this.blurTo = null;
      }
    }

    /*----------------------------------------------------------------
     * Perform any changes which were quashed during editing
     */
    onBlur() {
      if (this.blurTo !== null && this.el.value != this.blurTo) {
        this.el.value = this.blurTo;
      }
      this.blurTo = null;
      this.initialized = false;
      this.stable.onNext( <any>flush );
    }

    /*----------------------------------------------------------------
     */
    onError( value: any ) { }

    /*----------------------------------------------------------------
     */
    onCompleted() { }

  }

}
