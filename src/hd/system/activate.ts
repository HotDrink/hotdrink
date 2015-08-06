module hd.system {

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;

  /*==================================================================
   * An operation over variables in the property model
   */
  export interface Operation {

    // Function that implements this operation
    fn: Function;

    // Alternative to fn -- a hard-coded function result
    result: any;

    // Inputs to pass to the function, in the order they should be passed
    // Variables in this list will be replaced with their value; everything
    // else will be treated as constants to be passed to the function.
    inputs: any[];

    // Parallel to inputs; true means input comes from prior generation
    priorFlags: boolean[];

    // Outputs to write to, in the order they are returned form the function
    outputs: m.Variable[];

    // Is this an external operation?  (Does it trigger an update after execution?)
    external: boolean;

  }

  /*==================================================================
   */

  export
  interface ActivationRecord {
    inputs: u.Dictionary<r.Promise<any>>;
    outputs: u.Dictionary<r.Promise<any>>;
  }

  /*==================================================================
   */

  function constantFunction( result: any, numOutputs = 1 ): r.Promise<any>|r.Promise<any>[] {
    var outs: r.Promise<any>[] = [];

    for (var i = 0; i < numOutputs; ++i) {
      outs.push( new r.Promise<any>() );
    }

    if (numOutputs == 1) {
      result = [result];
    }
    else if (! Array.isArray( result )) {
      console.error( 'Multi-output constant did not supply array' );
      for (var i = 0; i < numOutputs; ++i) {
        outs[i].reject( null );
      }
      return;
    }

    for (var i = 0; i < numOutputs; ++i) {
      outs[i].resolve( result[i] );
    }

    return numOutputs == 1 ? outs[0] : outs;
  }

  /*==================================================================
   */

  export
  function activate( op: Operation ): ActivationRecord {
    var params: any[] = [];

    var priorLookup: u.Dictionary<r.Promise<any>> = {};
    var inputLookup: u.Dictionary<r.Promise<any>> = {};
    var outputLookup: u.Dictionary<r.Promise<any>> = {};

    // Collect parameter promises
    for (var i = 0, l = op.inputs.length; i < l; ++i) {
      var param: r.Promise<any>;

      // An input is either a variable or a constant
      var input = op.inputs[i];
      if (input instanceof m.Variable) {

        // If it's a variable, determine what promise to use
        if (op.priorFlags && op.priorFlags[i]) {
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
          r.plogger.register( param, op.inputs[i], 'constant parameter' );
        }
        param.resolve( op.inputs[i] );
      }

      params.push( param );
    }

    // Invoke the operation
    try {
      var result: any;
      if (op.fn) {
        result = op.fn.apply( null, params );
      }
      else {
        result = constantFunction( op.result, op.outputs.length );
      }

      // Ensure result is an array
      if (op.outputs.length > 0) {
        if (op.outputs.length == 1) {
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
      for (var i = 0, l = op.outputs.length; i < l; ++i) {
        var p = new r.Promise<any>();
        p.reject( null );
        result.push( p );
      }
    }

    // Set output promises
    for (var i = 0, l = op.outputs.length; i < l; ++i) {
      // An output is always a variable
      var vv = op.outputs[i];
      if (outputLookup[vv.id]) {
        console.error( 'Operation attempting to output same variable twice' );
      }
      else {
        var p = <r.Promise<any>>result[i];
        outputLookup[vv.id] = p
        if (r.plogger) {
          r.plogger.register( p, vv.name, 'output parameter' );
        }
        if (op.external) {
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
