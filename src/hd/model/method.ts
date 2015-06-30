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
   * An activation over variables in the property model
   */
  export class Activation {

    // Unique identifier; assigned by Factory
    id: string;

    // Human readable name for programmer
    name: string;

    // Function that implements this activation
    fn: Function;

    // Inputs to pass to the function, in the order they should be passed
    // Variables in this list will be replaced with their value; everything
    // else will be treated as constants to be passed to the function.
    inputs: any[];

    // Parallel to inputs; true means input comes from prior generation
    priorFlags: boolean[];

    // Outputs to write to, in the order they are returned form the function
    outputs: Variable[];

    /*----------------------------------------------------------------
     * Initialize members
     */
    constructor( name: string,
                 fn: Function,
                 inputs: any[],
                 priorFlags: boolean[],
                 outputs: Variable[] ) {
      this.id = makeId( name );
      this.name = name;
      this.fn = fn;
      this.inputs = inputs;
      this.priorFlags = priorFlags;
      this.outputs = outputs;
    }

    /*----------------------------------------------------------------
     * Human readable name
     */
    toString(): string {
      return this.name;
    }

    /*----------------------------------------------------------------
     */
    static
    activate( act: Activation, external: boolean ): ActivationRecord {
      var params: any[] = [];

      var priorLookup: u.Dictionary<r.Promise<any>> = {};
      var inputLookup: u.Dictionary<r.Promise<any>> = {};
      var outputLookup: u.Dictionary<r.Promise<any>> = {};

      // Collect parameter promises
      for (var i = 0, l = act.inputs.length; i < l; ++i) {
        var param: r.Promise<any>;

        // An input is either a variable or a constant
        var input = act.inputs[i];
        if (input instanceof Variable) {

          // Determine what promise to use for this variable
          if (act.priorFlags && act.priorFlags[i]) {
            if (! (param = priorLookup[input.id])) {
              if (config.forwardPriorGens) {
                param = priorLookup[input.id] = input.getForwardedPromise();
              }
              else {
                param = priorLookup[input.id] = input.getCurrentPromise();
              }
            }
          }
          else {
            if (! (param = inputLookup[input.id])) {
              // Make a dependent promise for parameter
              param = inputLookup[input.id] = new r.Promise();
              var oldp = input.getStagedPromise();
              if (r.plogger) {
                r.plogger.register( param, input.name, 'input parameter' );
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
            r.plogger.register( param, act.inputs[i], 'constant parameter' );
          }
          param.resolve( act.inputs[i] );
        }

        params.push( param );
      }

      // Invoke the activation
      try {
        var result = act.fn.apply( null, params );

        // Ensure result is an array
        if (act.outputs.length > 0) {
          if (act.outputs.length == 1) {
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
        for (var i = 0, l = act.outputs.length; i < l; ++i) {
          var p = new r.Promise<any>();
          p.reject( null );
          result.push( p );
        }
      }

      // Set output promises
      for (var i = 0, l = act.outputs.length; i < l; ++i) {
        // An output is always a variable
        var vv = act.outputs[i];
        if (outputLookup[vv.id]) {
          console.error( 'Activation attempting to output same variable twice' );
        }
        else {
          var p = <r.Promise<any>>result[i];
          outputLookup[vv.id] = p
          if (r.plogger) {
            r.plogger.register( p, vv.name, 'output parameter' );
          }
          if (external) {
            vv.set( p );
          }
          else {
            vv.makePromise( p );
          }
        }
      }

      return {inputs:  inputLookup,
              outputs: outputLookup};
    }

  }

  /*==================================================================
   *  A method is an activation that is part of a constraint.  As such,
   *  it keeps track of input and output variables as they appear in
   *  the constraint graph.  Every input should be in inputVars, every
   *  output should be in outputVars.
   */
  export class Method extends Activation {

    // Set of variables used as input by this method.
    // Unlike "inputs" this list contains only variables
    //   and does not contain duplicates.
    inputVars: u.ArraySet<Variable>;

    /*----------------------------------------------------------------
     * Initialize members
     */
    constructor( name: string,
                 fn: Function,
                 inputs: any[],
                 priorFlags: boolean[],
                 outputs: Variable[],
                 inputVars: u.ArraySet<Variable> ) {
      super( name, fn, inputs, priorFlags, outputs );
      this.inputVars = inputVars;
    }

    activate(): ActivationRecord {
      return Activation.activate( this, false );
    }
  }

}
