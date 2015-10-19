module hd.binding {

  import u = hd.utility;
  import r = hd.reactive;

  export
  class MousePosition extends r.BasicObservable<u.Point> {

    pos: u.Point;

    constructor() {
      super();
      var that = this;
      document.addEventListener( 'mousemove', function( event: MouseEvent ) {
        that.pos = {x: event.clientX, y: event.clientY};
        that.sendNext( that.pos );
      } );
    }

    get(): u.Point {
      return this.pos;
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
