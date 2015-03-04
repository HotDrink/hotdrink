module hd {

  export
  function notify( result: any ) {
    (<Function>self.postMessage)( {result: result, complete: false} );
  }

  export
  function fulfill( result: any ) {
    (<Function>self.postMessage)( {result: result, complete: true} );
  }

  export
  function reject( error: any ) {
    (<Function>self.postMessage)( {error: error, complete: true} );
  }

  self.addEventListener( 'message', function( event ) {

    var fn: Function = (<any>self)[event.data.fnName];
    if (typeof fn === 'function') {
      try {
        var result = fn.apply( null, event.data.inputs );
        if (result !== undefined) {
          fulfill( result );
        }
      }
      catch (e) {
        if (typeof e === 'object' &&
            Object.getPrototypeOf( e ) !== Object.prototype) {
          e = e.toString();
        }
        reject( e );
      }
    }
    else {
      reject( 'Unknown function: ' + event.data.fnName );
    }

  } );
}
