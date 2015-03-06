/*####################################################################
 * Lifting function over values to function over promises.
 */
module hd.reactive {

  /*==================================================================
   * The actual lifting function.
   */
  export function liftFunction( fn: Function,
                                numOutputs: number = 1,
                                mask: boolean[] = null  ) {
    return function( ...parameters: Promise<any>[] ) {
      var pack = new ParameterPack( parameters, mask );
      var fnCall = new SingleFunctionCall( fn, pack.promise, numOutputs );
      return (fnCall.outputPromises.length <= 1) ?
            <any>fnCall.outputPromises[0] : <any>fnCall.outputPromises;
    }
  }

  /*==================================================================
   * Takes a Promise<any>[], and returns a Promise<any[]>.
   */
  export class ParameterPack {

    // The promise produced
    promise: Promise<any[]>;

    // The input promises
    private inputs: Promise<any>[];

    // The corresponding values produced by the input promises
    private values: any[] = [];

    // How many input promises have been fulfilled
    private numFulfilled = 0;

    /*----------------------------------------------------------------
     * Creates dependencies for each input promise
     */
    constructor( inputs: Promise<any>[], mask?: boolean[] ) {
      var numInputs = inputs.length;
      this.inputs = inputs;
      this.values.length = numInputs;
      this.promise = new Promise<any[]>();
      if (plogger) {
        plogger.register( this.promise, 'parampack', 'parameter pack' );
      }
      this.promise.ondropped.addObserver( this );

      if (numInputs) {
        for (var i = 0; i < numInputs; ++i) {
          if (mask && mask[i]) {
            this.onParameterFulfilled( inputs[i], i );
          }
          else {
            inputs[i].addDependency<void, number>(
              this,
              this.onParameterFulfilled,
              this.onParameterRejected,
              this.onParameterProgress,
              i
            );
          }
        }
      }
      else {
        this.promise.resolve( this.values );
      }
    }

    /*----------------------------------------------------------------
     * Set the corresponding value; fulfill or notify
     */
    onParameterFulfilled( value: any, index: number ) {
      this.values[index] = value;
      if (++this.numFulfilled == this.values.length) {
        this.promise.resolve( this.values );
      }
      else {
        this.promise.notify( this.values );
      }
    }

    /*----------------------------------------------------------------
     * If any parameter fails then we fail.
     */
    onParameterRejected( reason: any, index: number ) {
      this.promise.reject( "Failed dependency" );
    }

    /*----------------------------------------------------------------
     * Set the corresponding value; notify
     */
    onParameterProgress( value: any, index: number ) {
      this.values[index] = value;
      this.promise.notify( this.values );
    }

    /*----------------------------------------------------------------
     * When parameters no longer needed, unsubscribe from all
     */
    onNext() {
      this.inputs.forEach( function( p: Promise<any> ) {
        p.removeDependency( this );
      }, this );
      this.promise.ondropped.removeObserver( this );
    }

    onError() { }

    onCompleted() { }

  }

  /*==================================================================
   * Takes a function and a promise for an array of parameters,
   * returns a promise for the result of calling the function.
   * Only calls the function one time, once all parameters are ready.
   */
  export class SingleFunctionCall {

    // The function to call
    fn: Function;

    // Promises for the parameters to pass
    parameters: Promise<any[]>;

    // Promises for each output produced
    outputPromises: Promise<any>[] = [];

    /*----------------------------------------------------------------
     * Subscribes to parameters; creates output promises
     */
    constructor( fn: Function,
                 parameters: Promise<any[]>,
                 numOutputs: number
               ) {
      this.fn = fn;
      this.parameters = parameters;
      parameters.addDependency( this );
      for (var i = 0; i < numOutputs; ++i) {
        var p = new Promise<any>();
        p.ondropped.addObserver( this );
        this.outputPromises.push( p );
      }
    }

    /*----------------------------------------------------------------
     * Call the function and pass on results
     */
    onFulfilled( value: any[] ) {
      var numOutputs = this.outputPromises.length;
      try {
        var result = this.fn.apply( null, value );
        if (numOutputs == 1) {
          result = [result];
        }
        else if (! Array.isArray( result )) {
          throw new TypeError( 'Multi-output method did not return array' );
        }

        for (var i = 0; i < numOutputs; ++i) {
          this.outputPromises[i].resolve( result[i] );
          if (result[i] instanceof Promise && !(<Promise<any>>result[i]).isSettled()) {
            this.outputPromises[i].ondropped.addObserver( result[i] );
          }
        }
      }
      catch (e) {
        console.error( e );
        for (var i = 0; i < numOutputs; ++i) {
          this.outputPromises[i].reject( e );
        }
      }
    }

    /*----------------------------------------------------------------
     * If the parameters fail then the function fails
     */
    onRejected( reason: any ) {
      var numOutputs = this.outputPromises.length;
      for (var i = 0; i < numOutputs; ++i) {
        this.outputPromises[i].reject( reason );
      }
    }

    /*----------------------------------------------------------------
     * Ignore
     */
    onProgress() { }

    /*----------------------------------------------------------------
     * If everyone stops listening to the result, we cancel the call
     */
    onNext() {
      var anyRelevant = this.outputPromises.some( function( p: Promise<any> ) {
        return p.hasDependencies();
      } );
      if (! anyRelevant) {
        this.parameters.removeDependency( this );
        this.outputPromises.forEach( function( p: Promise<any> ) {
          p.ondropped.removeObserver( this );
        } );
      }
    }

    // ignore
    onError() { }

    // ignore
    onCompleted() { }

  }

}