module hd.system {

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;

  /*==================================================================
   * An operation over variables in the property model
   */
  export
  interface Operation {

    // Function that implements this operation
    fn: Function;

    // Alternative to fn -- a hard-coded function result
    result: any;

    // Inputs to pass to the function, in the order they should be passed
    // Variables in this list will be replaced with their value; everything
    // else will be treated as constants to be passed to the function.
    inputs: u.MultiArray<any>;

    // Parallel to inputs; true means input comes from prior generation
    priorFlags: u.MultiArray<boolean>;

    // Outputs to write to, in the order they are returned form the function
    outputs: u.MultiArray<m.Variable>;

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
   * Serves as a constant function for operations that only give a
   * result.
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
    var inputLookup: u.Dictionary<r.Promise<any>> = {};
    var priorLookup: u.Dictionary<r.Promise<any>> = {};
    var outputLookup: u.Dictionary<r.Promise<any>> = {};

    /*----------------------------------------------------------------
     * Recursive function for building parameter multi-array while
     * recording the promise retrieved from each variable.
     */
    function collectParams(
      inputs:      u.MultiArray<any>,
      priors:      u.MultiArray<boolean>
    ) {

      var params: u.MultiArray<r.Promise<any>> = [];

      // Collect parameter promises
      for (var i = 0, l = inputs.length; i < l; ++i) {

        // An input is either a variable, an array, or a constant
        var input = inputs[i];
        var prior = priors ? priors[i] : undefined;
        if (input instanceof m.Variable) {
          var param: r.Promise<any>;

          // If it's a variable, determine what promise to use
          if (prior) {
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
              // Make a new, dependent promise for evaluation graph
              param = inputLookup[input.id] = new r.Promise();
              var oldp = input.getStagedPromise();
              if (r.plogger) {
                r.plogger.register( param, input.name, 'input parameter' );
              }
              param.resolve( oldp );
              param.ondropped.addObserver( oldp );
            }
          }
          params.push( param );
        }
        else if (Array.isArray( input )) {
          // If its an array, we recurse
          params.push( collectParams( <u.MultiArray<any>>input,
                                      <u.MultiArray<boolean>>prior ) );
        }
        else {
          // If it's a constant, we create a satisfied promise
          var param = new r.Promise<any>();
          if (r.plogger) {
            r.plogger.register( param, op.inputs[i], 'constant parameter' );
          }
          param.resolve( op.inputs[i] );
          params.push( param );
        }

      }

      return params;
    }

    /*----------------------------------------------------------------
     * Recursive function which assigns method results to
     * corresponding variables of the output signature, while
     * recording the promise for each output variable.
     *
     * If the method returned a single promise in place of a
     * multi-array of promises, then this function (1) generates the
     * multi-array of promises required, and (2) subscribes to the
     * single promise so that when it is resolved, its value will be
     * used to resolve the generated multi-array.
     */

    function assignResults(
      output:       m.Variable | u.MultiArray<m.Variable>,
      result:       r.Promise<any> | u.MultiArray<r.Promise<any>>
    ) {

      if (output instanceof m.Variable) {
        // If we were expecting a single value...

        if (outputLookup[output.id]) {
          // This would only happen if an operation has the same output twice
          //   -- i.e., an invalid method
          console.error( 'Operation attempting to output twice to same variable' );
        }
        else {
          // Get promise
          var p: r.Promise<any>;
          if (result instanceof r.Promise) {
            p = result;
          }
          else {
            p = new r.Promise<any>( result );
          }
          if (r.plogger) {
            r.plogger.register( p, output.name, 'output' );
          }

          // Record promise
          outputLookup[output.id] = p;

          // Assign result
          if (op.external) {
            output.set( p );
          }
          else {
            output.makePromise( p );
          }
        }
      }
      else if (Array.isArray( output )) {
        // If we were expecting a multi-array...

        var outputs = <u.MultiArray<m.Variable>> output; // just to avoid type-casts

        // If we got an array, then recursively match the promises
        if (Array.isArray( result )) {
          var results = <u.MultiArray<any>>result; // just to avoid type-casts
          for (var i = 0, l = outputs.length; i < l; ++i) {
            assignResults( outputs[i], results[i] );
          }
        }
        else {

          // Then we resolve the multi-array using the value of the single promise
          var p: r.Promise<any>;
          if (result instanceof r.Promise) {
            p = result;
          }
          else {
            p = new r.Promise( result );
            if (r.plogger) {
              r.plogger.register( p, '?', 'output placeholder' );
            }
          }

          var promises = <u.MultiArray<r.Promise<any>>>generatePromises( outputs );

          p.addDependency(
            null,
            resolveMany( promises ),
            rejectMany( promises ),
            null
          );
        }
      }

    }

    /*----------------------------------------------------------------
     * Generates a multi-array of promises which is parallel to the
     * provided multi-array of variables: one promise for each
     * variable
     */

    function generatePromises(
      output: m.Variable | u.MultiArray<m.Variable>
    ):        r.Promise<any> | u.MultiArray<r.Promise<any>> {

      if (output instanceof m.Variable) {
        if (outputLookup[output.id]) {
          console.error( 'Operation attempting to output twice to same variable' );
        }
        else {
          var p = outputLookup[output.id] = new r.Promise<any>();
          if (r.plogger) {
            r.plogger.register( p, output.name, 'output' );
          }
          // Assign result
          if (op.external) {
            output.set( p );
          }
          else {
            output.makePromise( p );
          }
          return p;
        }
      }
      else {
        var outputs = <u.MultiArray<m.Variable>>output; // just to avoid type-casts
        var ps: u.MultiArray<r.Promise<any>> = [];
        for (var i = 0, l = outputs.length; i < l; ++i) {
          ps[i] = generatePromises( outputs[i] );
        }
        return ps;
      }
    }

    /*----------------------------------------------------------------
     * Body of activate
     */

    // Get the parameters
    var params = collectParams( op.inputs, op.priorFlags );

    // Invoke the operation
    try {
      var result: any;
      if (op.fn) {
        result = op.fn.apply( null, params );
      }
      else {
        result = op.result;
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

    // Match results to signature
    assignResults( op.outputs[0], result );

    return {inputs:  inputLookup,
            outputs: outputLookup};
  }

  /*==================================================================
   * Resolves all promises in a promise multi-array with corresponding
   * value in value multi-array.  If we find a single value where we
   * were expecting an multi-array of values, then we assume it is a
   * promise and subscribe to it so that we can use its value to
   * fulfill the multi-array.  Curried to make it easier to subscribe
   * to promises.
   */
  function resolveMany( promises: u.MultiArray<r.Promise<any>> ) {
    return function( results: any ) {
      // It should be an array (we wouldn't use this for a single promise)
      if (Array.isArray( results )) {
        for (var i = 0, l = promises.length; i < l; ++i) {
          var promise = promises[i];
          var result = results[i];
          if (promise instanceof r.Promise) {
            // Single promise
            promise.resolve( result );
          }
          else if (Array.isArray( promise )) {
            var subpromises = <u.MultiArray<r.Promise<any>>>promise; // just to avoid type-casts
            // Array of promises
            if (Array.isArray( result )) {
              // Array of values
              resolveMany( subpromises )( result );
            }
            else {
              // Single value
              var p: r.Promise<any>;
              if (result instanceof r.Promise) {
                p = result;
              }
              else {
                p = new r.Promise( result );
              }
              p.addDependency(
                null,
                resolveMany( subpromises ),
                rejectMany( subpromises ),
                null
              );
            }
          }
        }
      }
      else {
        console.error( "Expected array for return value of method" );
        rejectMany( promises )( "Internal error" );
      }
    }
  }

  function rejectMany( promises: u.MultiArray<r.Promise<any>> ) {
    return function( reason: any ) {
      for (var i = 0, l = promises.length; i < l; ++i) {
        var promise = promises[i];
        if (promise instanceof r.Promise) {
          promise.reject( reason );
        }
        else {
          rejectMany( <u.MultiArray<r.Promise<any>>>promise)( reason );
        }
      }
    }
  }
}
