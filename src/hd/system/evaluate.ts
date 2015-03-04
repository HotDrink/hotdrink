/*********************************************************************
 * This contains the two work-horses of evaluation: the variable
 * validation function and the method execution function.  Validate is
 * called on all variables whose values were set; execute is called on
 * all methods downstream of those variables.
 *
 * It is important to remember that, at this level of abstraction,
 * methods are actually just functions from promises to promises.
 * We execute all methods, but executing a method really only amounts
 * to connecting the input promises to the output promises.
 *
 * Also, all methods are executed in topological order.  This ensures
 * that promises for variables are in place before they are used.
 */

module hd.system {

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;
  import e = hd.enable;

  /*==================================================================
   * Execute a single method.
   */
  export function execute( mm: m.Method, enable: e.EnablementManager ) {

    var params: any[] = [];
    var paramLookup: u.Dictionary<r.Promise<any>> = {};

    // Collect input promises
    var inputs = mm.inputs;
    for (var i = 0, l = inputs.length; i < l; ++i) {
      // An input is either a variable or a constant
      if (inputs[i] instanceof m.Variable) {
        // If it's a variable, we use the promise for its value
        var pvid = (<m.Variable>inputs[i]).id;
        // Make sure we've got a promise in the lookup
        if (! paramLookup[pvid]) {
          var oldp = (<m.Variable>inputs[i]).getPromise();
          var param = new r.Promise();
          if (r.plogger) {
            r.plogger.register( param, (<m.Variable>inputs[i]).name, 'input parameter' );
          }
          param.resolve( oldp );
          if (oldp instanceof r.Promise) {
            param.ondropped.addObserver( oldp );
          }
          paramLookup[pvid] = param;
        }
        params.push( paramLookup[pvid] );
      }
      else {
        // If it's a constant, we create a satisfied promise
        var p = new r.Promise( inputs[i] );
        if (r.plogger) {
          r.plogger.register( p, inputs[i], 'constant parameter' );
        }
        params.push( p );
      }
    }

    try {
      // Invoke the method
      var result = mm.fn.apply( null, params );

      // Ensure result is an array
      if (mm.outputs.length == 1) {
        result = [result];
      }
      else if (! Array.isArray( result )) {
        throw new TypeError( 'Multi-output method did not return array' );
      }
      else {
        result = result.slice( 0 );
      }

      // Set output promises
      var outputs = mm.outputs;
      for (var i = 0, l = outputs.length; i < l; ++i) {
        // An output is either a variable or null
        if (outputs[i] instanceof m.Variable) {
          if (r.plogger) {
            r.plogger.register( result[i], (<m.Variable>outputs[i]).name, 'output parameter' );
          }
          (<m.Variable>outputs[i]).makePromise( result[i] );
        }
      }

      enable.methodScheduled( mm.id, paramLookup, result );
    }
    catch (e) {
      // TODO: Figure out what this means
      console.error( e );
    }
  }

}