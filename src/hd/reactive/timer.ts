module hd.reactive {

  if (! performance) {
    performance = {};
  }
  if (! performance.now) {
    performance.now =
          performance.mozNow     ||
          performance.msNow      ||
          performance.oNow       ||
          performance.webkitNow  ||
          Date.now;
  }

  function makeFunctionTimer( fn: Function ) {
    var timer = new r.BasicObservable<number>();
    var wrapper = function timewrap() {
      var start = performance.now();
      var result = fn.apply( this, arguments );
      var end = performance.now();
      timer.sendNext( end - start );
      return result;
    };

    return {wrapper: wrap, timer: timer};
  }

}