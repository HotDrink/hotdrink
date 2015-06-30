/*####################################################################
 * Extensions are Observers and Observables.  They take events
 * produced by an Observable, modify them somehow, and then pass them
 * on.
 */
module hd.reactive {

  import u = hd.utility;

  /*==================================================================
   * Base class - simply take an event and pass it on.
   *
   * Derived classes can simply modify any events that are needed.
   */
  export class Extension<T, U> extends BasicObservable<U> {
    onNext( value: T ): void {
      this.sendNext( <any>value );
    }

    onError( error: any ): void {
      this.sendError( error );
    }

    onCompleted(): void {
      this.sendCompleted();
    }
  }

  export interface ExtensionType<T, U> {
    new (...args: any[]): Extension<T, U>
  }

  /*------------------------------------------------------------------
   * Creates an extension from a single transformation function.
   */
  export class FunctionExtension extends Extension<any,any> {

    fn: Function;

    constructor( fn: Function, boundArgs: any[] ) {
      super();
      this.fn = (boundArgs && boundArgs.length) ? fn.bind.apply( fn, (<any[]>[null]).concat( boundArgs ) ) : fn;
    }

    onNext( value: any ) {
      try {
        this.sendNext( this.fn( value ) );
      }
      catch (e) {
        this.sendError( e );
      }
    }

    onError( error: any ): void {
      this.sendError( error );
    }

    onCompleted(): void {
      this.sendCompleted();
    }
  }

  /*==================================================================
   * Basically a linked list of extensions, treated as a single
   * extension.  Can be empty, in which case it just acts as a
   * pass-through.
   */
  export class Chain<T, U> extends BasicObservable<U> {

    // The list
    exts: Extension<any, any>[];

    /*----------------------------------------------------------------
     * Link together
     */
    constructor( exts: Extension<any, any>[] ) {
      super();
      this.exts = exts = exts ? exts.slice( 0 ) : [];
      for (var i = 1, l = exts.length; i < l; ++i) {
        exts[i - 1].addObserver( exts[i] );
      }
      if (i > 1) {
        this.forward( exts[l - 1] );
      }
    }

    /*----------------------------------------------------------------
     * Observe and pass on.
     */
    private forward( ext: Extension<any, any> ) {
      ext.addObserver( this,
                       this.sendNext,
                       this.sendError,
                       this.sendCompleted
                     );
    }

    /*----------------------------------------------------------------
     * Pass values to head of the list.
     */
    onNext( value: T ) {
      if (this.exts.length) {
        this.exts[0].onNext( value );
      }
      else {
        this.sendNext( <any>value );
      }
    }

    /*----------------------------------------------------------------
     * Pass errors to head of the list.
     */
    onError( error: any ) {
      if (this.exts.length) {
        this.exts[0].onError( error );
      }
      else {
        this.sendError( error );
      }
    }

    /*----------------------------------------------------------------
     * Pass completed to head of the list.
     */
    onCompleted() {
      if (this.exts.length) {
        this.exts[0].onCompleted();
      }
      else {
        this.sendCompleted();
      }
    }

    /*----------------------------------------------------------------
     * Add new extension to the tail of the list
     */
    push( ext: Extension<any, any> ) {
      if (this.exts.length) {
        var last = this.exts[this.exts.length - 1];
        last.removeObserver( this );
        last.addObserver( ext );
      }
      this.forward( ext );
      this.exts.push( ext );
    }

    /*----------------------------------------------------------------
     * Remove extension from the tail of the list
     */
    pop() {
      if (this.exts.length) {
        var ext = this.exts.pop();
        ext.removeObserver( this );
        if (this.exts.length) {
          this.forward( this.exts[this.exts.length - 1] );
        }
      }
      return ext;
    }

    /*----------------------------------------------------------------
     * Add new extension to the head of the list
     */
    unshift( ext: Extension<any, any> ) {
      if (this.exts.length) {
        ext.addObserver( this.exts[0] );
      }
      else {
        this.forward( ext );
      }
      this.exts.unshift( ext );
    }

    /*----------------------------------------------------------------
     * Remove extension from the tail of the list
     */
    shift() {
      if (this.exts.length) {
        var ext = this.exts.shift();
        if (this.exts.length) {
          ext.removeObserver( this.exts[0] );
        }
        else {
          ext.removeObserver( this );
        }
      }
      return ext;
    }

  }

  /*==================================================================
   */
  export
  class HotSwapObservable<T> extends BasicObservable<T> {
    source: Signal<T>;
    proxy: ProxyObserver<T>;

    constructor( source?: Signal<T> ) {
      super();
      this.proxy = new ProxyObserver<T>( this,
                                         this.onSourceNext,
                                         this.onSourceError,
                                         this.onSourceCompleted );
      this.source = source;
      if (source) {
        source.addObserver( this.proxy );
      }
    }

    onSourceNext( value: T ) {
      this.sendNext( value );
    }

    onSourceError( error: any ) {
      this.sendError( error );
    }

    onSourceCompleted() {
      this.sendCompleted();
    }

    onNext( source: Signal<T> ) {
      if (this.source) {
        this.source.removeObserver( this.proxy );
      }
      this.source = source;
      if (source) {
        source.addObserver( this.proxy );
      }
    }

    onError() { }

    onCompleted() { }
  }

  export
  class HotSwapSignal<T> extends HotSwapObservable<T> {
    get(): T {
      return this.source ? this.source.get() : undefined;
    }

    onNext( source: Signal<T> ) {
      var oldsource = this.source;
      this.source = source;
      if (oldsource) {
        oldsource.removeObserver( this.proxy );
      }
      if (source) {
        source.addObserver( this.proxy );
      }
      if (oldsource && ! source) {
        this.sendNext( undefined );
      }
    }
  }

  /*==================================================================
   */
  export
  interface SwapTarget<T> extends ProxySignal<T>, Observer<T> { }

  export
  class HotSwap<T> extends BasicObservable<T> {

    source: ProxySignal<SwapTarget<T>>;
    target: SwapTarget<T>;
    last: any;

    constructor( source: ProxySignal<SwapTarget<T>> ) {
      super();
      this.source = source;
      this.target = null;
      source.addObserver( this, this.onNextTarget, null, null );
      if (source) {
        this.onNextTarget( source.get() );
      }
    }

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
    addObserver(): Observer<T> {
      var o = super.addObserver.apply( this, arguments );
      if (this.last !== undefined) {
        o.onNext( this.last );
      }
      return o;
    }

    onNextTarget( target: SwapTarget<T> ) {
      if (this.target) {
        this.target.removeObserver( this );
      }
      this.target = target;
      if (this.target) {
        target.addObserver( this, this.onTargetNext, this.onTargetError, this.onTargetCompleted );
      }
    }

    onNext( value: T ) {
      if (this.target) {
        this.target.onNext( value );
      }
    }

    onError( error: any ) {
      if (this.target) {
        this.target.onError( error );
      }
    }

    onCompleted() {
      if (this.target) {
        this.target.onCompleted();
      }
    }

    onTargetNext( value: T ) {
      this.last = value;
      this.sendNext( value );
    }

    onTargetError( error: any ) {
      this.sendError( error );
    }

    onTargetCompleted() {
      this.sendCompleted();
      this.target = null;
    }
  }

  /*==================================================================
   */
  export
  class ReadWrite<T, U> extends Extension<T, U> {

    constructor( private read: Observable<U>, private write: Observer<T> ) {
      super()
    }

    addObserver( observer: Observer<U> ): Observer<U>;
    addObserver( object: Object,
                 onNext: (value: U) => void,
                 onError: (error: any) => void,
                 onCompleted: () => void        ): Observer<U>;
    addObserver<U>( object: Object,
                    onNext: (value: U, id?: U) => void,
                    onError: (error: any, id?: U) => void,
                    onCompleted: (id?: U) => void,
                    id: U                                  ): Observer<U>;
    addObserver() {
      return this.read.addObserver.apply( this.read, arguments );
    }

    removeObserver( observer: Object ): boolean {
      this.read.removeObserver( <any>observer );
      return true;
    }

    onNext( value: T ) {
      this.write.onNext( value );
    }

    onError( error: any ) {
      this.write.onNext( error );
    }

    onCompleted() {
      this.write.onCompleted();
    }
  }

  /*==================================================================
   */

  export
  class Delay<T> extends Extension<T, T> {

    constructor( public time_ms: number ) { super() }

    onNext( value: T ) {
      setTimeout( this.sendNext.bind( this, value ), this.time_ms );
    }

    onError( error: any ) {
      setTimeout( this.sendError.bind( this, error ), this.time_ms );
    }

    onCompleted() {
      setTimeout( this.sendCompleted.bind( this ), this.time_ms );
    }

  }

  /*==================================================================
   * Cuts down the number of events produced.  When it receives an
   * event, it waits a specified amount of time.  If other events come
   * in during that time period then it discards the first event; if
   * not, then it passes it on.
   */
  enum StabilizerState { None, Next, Error };

  export class Stabilizer<T> extends Extension<T, T> {

    // What event we are waiting on
    private state: StabilizerState = StabilizerState.None;

    // The argument for the event we are waiting on
    private arg: any;

    // The timer id for the event we are waiting on
    private task: number = null;

    // How many milliseconds to wait
    private time: number;

    private flush: Object;

    /*----------------------------------------------------------------
     * Initialize
     */
    constructor( time_ms = 400, flush?: Object ) {
      super();
      this.time = time_ms;
      this.flush = flush;

      // Make personalized version of this callback which
      //   always invokes on this object
      this.onTimeout = this.onTimeout.bind( this );
    }

    /*----------------------------------------------------------------
     * Throw away any events currently being waited on, and wait on
     * this one.
     */
    onNext( value: T ) {
      if (this.flush !== undefined && value === this.flush) {
        if (this.task) {
          clearTimeout( this.task );
          this.onTimeout();
        }
      }
      else {
        this.state = StabilizerState.Next;
        this.arg = value;
        if (this.task) {
          clearTimeout( this.task );
        }
        this.task = setTimeout( this.onTimeout, this.time );
      }
    }

    /*----------------------------------------------------------------
     * Throw away any events currently being waited on, and wait on
     * this one.
     */
    onError( error: any ) {
      this.state = StabilizerState.Error;
      this.arg = error;
      if (this.task) {
        clearTimeout( this.task );
      }
      this.task = setTimeout( this.onTimeout, this.time );
    }

    /*----------------------------------------------------------------
     * Fire any events currently being waited on, and then the
     * "completed" event.
     */
    onCompleted() {
      if (this.task) {
        clearTimeout( this.task );
        this.onTimeout();
      }
      this.sendCompleted();
    }

    /*----------------------------------------------------------------
     * Done waiting - fire the event being waited on
     */
    onTimeout() {
      if (this.state == StabilizerState.Next) {
        this.sendNext( this.arg );
      }
      else if (this.state == StabilizerState.Error) {
        this.sendError( this.arg );
      }
      this.state = StabilizerState.None;
      this.task = null;
    }
  }

  /*==================================================================
   */
  export class ReplaceError extends Extension<any,any> {
    constructor( private replacement: any ) { super(); }

    onError( value: any ) {
      this.sendError( this.replacement );
    }
  }

  export class Required extends Extension<any,any> {
    onNext( value: any ) {
      if (value === undefined || value === null || value === '')
      {
        this.sendError( 'Required' );
      }
      else {
        this.sendNext( value );
      }
    }
  }

  export class Default extends Extension<any,any> {
    constructor( private defaultValue: any ) { super(); }

    onNext( value: any ) {
      if (value === undefined || value === null || value === '')
      {
        this.sendNext( this.defaultValue );
      }
      else {
        this.sendNext( value );
      }
    }

    onError() {
      this.sendNext( this.defaultValue );
    }
  }

  /*==================================================================
   * Convert value to string using toString method.
   */
  export class ToString extends Extension<any,string> {
    onNext( value: any ) {
      if (value === undefined || value === null) {
        this.sendNext( "" );
      }
      else {
        this.sendNext( value.toString() );
      }
    }
  }

  /*==================================================================
   * Convert value to JSON string.
   */
  export class ToJson extends Extension<any,string> {
    onNext( value: any ) {
      this.sendNext( JSON.stringify( value ) );
    }
  }

  /*==================================================================
   * Round number to specified number of digits after decimal point.
   */
  export class Round extends Extension<number,number> {
    scale: number;

    constructor( places = 0 ) {
      super();
      this.scale = 1;

      if (places < 0) {
        for (var i = 0, l = places; i > l; --i) {
          this.scale/= 10;
        }
      }
      else {
        for (var i = 0, l = places; i < l; ++i) {
          this.scale*= 10;
        }
      }
    }

    onNext( value: number ) {
      this.sendNext( Math.round( value * this.scale ) / this.scale );
    }
  }

  /*==================================================================
   * Convert number to string with fixed number of decimal places.
   */
  export class NumberToFixed extends Extension<number,string> {
    places: number;

    constructor( places: number ) {
      super();
      this.places = places;
    }

    onNext( value: number ) {
      this.sendNext( value.toFixed( this.places ) );
    }
  }

  /*==================================================================
   * Convert number to string with given precision.
   */
  export class NumberToPrecision extends Extension<number,string> {
    sigfigs: number;

    constructor( sigfigs: number ) {
      super();
      this.sigfigs = sigfigs;
    }

    onNext( value: number ) {
      this.sendNext( value.toPrecision( this.sigfigs ) );
    }
  }

  /*==================================================================
   * Convert number to fixed using exponential notation.
   */
  export class NumberToExponential extends Extension<number,string> {
    places: number;

    constructor( places: number ) {
      super();
      this.places = places;
    }

    onNext( value: number ) {
      this.sendNext( value.toExponential( this.places ) );
    }
  }

  /*==================================================================
   * Convert string value to number.
   */
  export class ToNumber extends Extension<string, number> {
    onNext( value: string ) {
      var n = Number( value );
      if (value == '' || isNaN( n )  || n === Infinity) {
        this.sendError( "Invalid number" );
      }
      else {
        this.sendNext( n );
      }
    }
  }

  /*==================================================================
   * Scale a number by a constant factor.
   */
  export class ScaleNumber extends Extension<number,number> {
    scale = 1;

    constructor( scale: number ) {
      super();
      this.scale = scale;
    }

    onNext( value: number ) {
      this.sendNext( this.scale * value );
    }
  }

  /*==================================================================
   * Convert value to date.
   */
  export
  class ToDate extends Extension<string,Date> {
    onNext( value: string ) {
      var d: Date;
      if (value == '' || isNaN( (d = new Date( value )).getTime() )) {
        this.sendError( "Invalid date" );
      }
      else {
        this.sendNext( d );
      }
    }
  }

  /*==================================================================
   * Convert date value to string.
   */
  export
  class DateToString extends Extension<Date,string> {
    onNext( value: Date ) {
      this.sendNext( value ? value.toLocaleString() : '' );
    }
  }

  /*==================================================================
   */
  export
  class DateToDateString extends Extension<Date,string> {
    onNext( value: Date ) {
      this.sendNext( value ? value.toLocaleDateString() : '' );
    }
  }

  /*==================================================================
   */
  export
  class DateToTimeString extends Extension<Date,string> {
    onNext( value: Date ) {
      this.sendNext( value ? value.toLocaleTimeString() : '' );
    }
  }

  /*==================================================================
   * Converts milliseconds to date string.
   */
  export
  class DateToMilliseconds extends Extension<Date,number> {
    onNext( value: Date ) {
      this.sendNext( value ? value.getTime() : 0 );
    }
  }

  /*==================================================================
   */
  export
  class MillisecondsToDate extends Extension<number,Date> {
    onNext( value: number ) {
      this.sendNext( new Date( value ) );
    }
  }

  /*==================================================================
   */
  export
  class Offset extends Extension<u.Point, u.Point> {
    constructor( public dx: number, public dy: number ) { super() }

    onNext( value: u.Point ) {
      this.sendNext( {x: value.x + this.dx, y: value.y + this.dy} );
    }
  }

  /*==================================================================
   */
  export
  class PointToString extends Extension<u.Point, string> {
    onNext( value: u.Point ) {
      this.sendNext( '(' + value.x + ', ' + value.y + ')' );
    }
  }
}
