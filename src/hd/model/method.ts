/*####################################################################
 * The Method class.
 */

module hd.config {
  export
  var forwardPriorGens = false;
}

module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  export
  interface ActivationRecord {
    inputs: u.Dictionary<r.Promise<any>>;
    outputs: u.Dictionary<r.Promise<any>>;
  }

  /*==================================================================
   * An operation over variables in the property model
   */
  export class Operation {

    // Unique identifier; assigned by Factory
    id: string;

    // Human readable name for programmer
    name: string;

    // Function that implements this method
    fn: Function;

    // Inputs to pass to the function, in the order they should be passed
    // Variables in this list will be replaced with their value; everything
    // else will be treated as constants to be passed to the function.
    inputs: any[];

    // Outputs to write to, in the order they are returned form the function
    // Variables in this list will be assigned their corresponding value;
    // everything else will cause the corresponding output to be ignored.
    outputs: any[];

    usePriors: boolean[];

    /*----------------------------------------------------------------
     * Initialize members
     */
    constructor( name: string,
                 fn: Function,
                 inputs: any[],
                 outputs: any[],
                 usePriors?: boolean[] ) {
      this.id = makeId( name );
      this.name = name;
      this.fn = fn;
      this.inputs = inputs;
      this.outputs = outputs;
      this.usePriors = usePriors;
    }

    /*----------------------------------------------------------------
     * Human readable name
     */
    toString(): string {
      return this.name;
    }

    /*----------------------------------------------------------------
     */
    activate( internal?: boolean ): ActivationRecord {
      var params: any[] = [];

      var priorLookup: u.Dictionary<r.Promise<any>> = {};
      var inputLookup: u.Dictionary<r.Promise<any>> = {};
      var outputLookup: u.Dictionary<r.Promise<any>> = {};

      // Collect parameter promises
      for (var i = 0, l = this.inputs.length; i < l; ++i) {
        var param: r.Promise<any>;

        // An input is either a variable or a constant
        if (this.inputs[i] instanceof Variable) {
          var vv = <Variable>this.inputs[i];

          // Determine what promise to use for this variable
          if (this.usePriors && this.usePriors[i]) {
            if (! (param = priorLookup[vv.id])) {
              if (config.forwardPriorGens) {
                param = priorLookup[vv.id] = vv.getForwardedPromise();
              }
              else {
                param = priorLookup[vv.id] = vv.getCurrentPromise();
              }
            }
          }
          else {
            if (! (param = inputLookup[vv.id])) {
              // Make a dependent promise for parameter
              param = inputLookup[vv.id] = new r.Promise();
              var oldp = vv.getStagedPromise();
              if (r.plogger) {
                r.plogger.register( param, vv.name, 'input parameter' );
              }
              param.resolve( oldp );
              param.ondropped.addObserver( oldp );
            }
          }
        }
        else {
          // If it's a constant, we create a satisfied promise
          param = new r.Promise();
          if (r.plogger) {
            r.plogger.register( param, this.inputs[i], 'constant parameter' );
          }
          param.resolve( this.inputs[i] );
        }

        params.push( param );
      }

      // Invoke the operation
      try {
        var result = this.fn.apply( null, params );

        // Ensure result is an array
        if (this.outputs.length > 0) {
          if (this.outputs.length == 1) {
            result = [result];
          }
          else if (! Array.isArray( result )) {
            throw new TypeError( 'Multi-output activating function did not return array' );
          }
        }
      }
      catch (e) {
        console.error( e );
        // Create failed promises for outputs
        result = [];
        for (var i = 0, l = this.outputs.length; i < l; ++i) {
          var p = new r.Promise<any>();
          p.reject( null );
          result.push( p );
        }
      }

      // Set output promises
      for (var i = 0, l = this.outputs.length; i < l; ++i) {
        // An output is either a variable or null
        if (this.outputs[i] instanceof Variable) {
          var vv = <Variable>this.outputs[i];
          if (outputLookup[vv.id]) {
            console.error( 'Operation attempting to output same variable twice' );
          }
          else {
            var p = <r.Promise<any>>result[i];
            outputLookup[vv.id] = p
            if (r.plogger) {
              r.plogger.register( p, vv.name, 'output parameter' );
            }
            if (internal) {
              vv.makePromise( p );
            }
            else {
              vv.onNext( p );
            }
          }
        }
      }

      return {inputs:  inputLookup,
              outputs: outputLookup};
    }

  }

  /*==================================================================
   *  A method is an operation that is part of a constraint.  As such,
   *  it keeps track of input and output variables as they appear in
   *  the constraint graph.  Every input should be in inputVars, every
   *  output should be in outputVars.
   */
  export class Method extends Operation {

    // Set of variables used as input by this method.
    // Unlike "inputs" this list contains only variables
    //   and does not contain duplicates.
    inputVars: u.ArraySet<Variable>;

    // Set of variables used as output by this method.
    // Unlike "outputs" this list contains only variables
    //   and does not contain duplicates.
    outputVars: u.ArraySet<Variable>;

    /*----------------------------------------------------------------
     * Initialize members
     */
    constructor( name: string,
                 fn: Function,
                 inputs: any[],
                 outputs: any[],
                 usePriors: boolean[],
                 inputVars: u.ArraySet<Variable>,
                 outputVars: u.ArraySet<Variable> ) {
      super( name, fn, inputs, outputs, usePriors );
      this.inputVars = inputVars;
      this.outputVars = outputVars;
    }
  }

}