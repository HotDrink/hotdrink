module hd.system {

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;

  export
  interface ActivationRecord {
    inputs: u.Dictionary<r.Promise<any>>;
    outputs: u.Dictionary<r.Promise<any>>;
  }

  export
  function activate( op: m.Operation,
                     forwardSelfLoops?: Forward,
                     internal?: boolean          ): ActivationRecord {
    var params: any[] = [];
    var inputs = op.inputs;
    var outputs = op.outputs;

    var inputLookup: u.Dictionary<r.Promise<any>> = {};
    var outputLookup: u.Dictionary<r.Promise<any>> = {};

    // Collect parameter promises
    for (var i = 0, l = inputs.length; i < l; ++i) {
      var param: r.Promise<any>;

      // An input is either a variable or a constant
      if (inputs[i] instanceof m.Variable) {
        var vv = <m.Variable>inputs[i];
        param = inputLookup[vv.id];
        if (! param) {
          if (outputs.indexOf( vv ) >= 0 && forwardSelfLoops == Forward.Yes) {
            param = inputLookup[vv.id] = vv.getForwardedPromise();
          }
          else {
            param = inputLookup[vv.id] = vv.getCurrentPromise();
          }
        }
      }
      else {
        // If it's a constant, we create a satisfied promise
        param = new r.Promise();
        if (r.plogger) {
          r.plogger.register( param, inputs[i], 'constant parameter' );
        }
        param.resolve( inputs[i] );
      }

      params.push( param );
    }

    // Invoke the operation
    try {
      var result = op.fn.apply( null, params );

      // Ensure result is an array
      if (op.outputs.length == 1) {
        result = [result];
      }
      else if (! Array.isArray( result )) {
        throw new TypeError( 'Multi-output operation did not return array' );
      }
    }
    catch (e) {
      console.error( e );
      // Create failed promises for outputs
      result = [];
      for (var i = 0, l = outputs.length; i < l; ++i) {
        var p = new r.Promise<any>();
        p.reject( null );
        result.push( p );
      }
    }

    // Set output promises
    for (var i = 0, l = outputs.length; i < l; ++i) {
      // An output is either a variable or null
      if (outputs[i] instanceof m.Variable) {
        var vv = <m.Variable>outputs[i];
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