module hd.binding {

  import r = hd.reactive;

  export
  class Time extends r.BasicObservable<Date> {

    constructor( time_ms: number ) {
      super();
      window.setInterval( this.update.bind( this ), time_ms );
    }

    update() {
      this.sendNext( new Date() );
    }

  }

}
