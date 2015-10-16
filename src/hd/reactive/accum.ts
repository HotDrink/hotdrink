module hd.reactive {

  const
  enum AccumState { Pending, Fulfill, Reject, Settled }

  export
  class AccumulatingPromise<T> extends Promise<T> {

    private accumState = AccumState.Pending;
    private accumValue: T = undefined;
    private accumReason: any = undefined;
    private timeout: number = null;
    private delay: number;

    constructor( value?: T ) {
      super();
      this.ontimeout = this.ontimeout.bind( this );
      if (arguments.length > 0) {
        this.accumState = AccumState.Fulfill;
        this.accumValue = value;
      }
    }

    setDelay( delay: number ) {
      if (this.timeout) {
        clearTimeout( this.timeout );
        this.timeout = null;
      }
      this.delay = delay;
      if (this.accumState === AccumState.Fulfill ||
          this.accumState === AccumState.Reject) {
        this.timeout = setTimeout( this.ontimeout, delay );
      }
    }

    private
    ontimeout() {
      this.timeout = null;
      this.settle();
    }

    settle() {
      if (this.timeout) {
        clearTimeout( this.timeout );
        this.timeout = null;
      }
      if (this.accumState === AccumState.Fulfill) {
        this.resolve( this.accumValue );
        this.accumValue = undefined;
      }
      else if (this.accumState === AccumState.Reject) {
        this.reject( this.accumReason );
      }
      this.accumState = AccumState.Settled;
    }

    updateResolve( value: T ) {
      if (this.accumState === AccumState.Settled) {
        this.resolve( value );
      }
      else {
        if (this.timeout) {
          clearTimeout( this.timeout );
          this.timeout = null;
        }
        this.accumState = AccumState.Fulfill;
        this.accumValue = value;
        this.accumReason = undefined;
        if (this.delay) {
          this.timeout = setTimeout( this.ontimeout, this.delay );
        }
      }
    }

    updateReject( reason: any ) {
      if (this.accumState === AccumState.Settled) {
        this.reject( reason );
      }
      else {
        if (this.timeout) {
          clearTimeout( this.timeout );
          this.timeout = null;
        }
        this.accumState = AccumState.Reject;
        this.accumReason = reason;
        this.accumValue = undefined;
        if (this.delay) {
          this.timeout = setTimeout( this.ontimeout, this.delay );
        }
      }
    }
  }

}
