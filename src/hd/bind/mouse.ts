module hd.bindings {

  import u = hd.utility;
  import r = hd.reactive;

  export
  class MousePosition extends r.BasicObservable<u.Point> {

    constructor() {
      super();
      var that = this;
      document.addEventListener( 'mousemove', function( event: MouseEvent ) {
        that.sendNext( {x: event.clientX, y: event.clientY} );
      } );
    }

  }

  var theMousePosition: MousePosition;

  export
  function getMousePosition() {
    if (! theMousePosition) {
      theMousePosition = new MousePosition();
    }
    return theMousePosition;
  }

}