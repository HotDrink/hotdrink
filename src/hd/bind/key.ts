module hd.bind {

  import r = hd.reactive;

  export
  class KeyDown extends r.BasicObservable<KeyboardEvent> {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLElement );
      this.el.addEventListener( 'keydown', this.onkeydown.bind( this ) );
    }

    onkeydown( e: KeyboardEvent ) {
      this.sendNext( e );
    }

  }

  export
  class Change extends r.BasicObservable<Event> {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLElement );
      this.el.addEventListener( 'change', this.onchange.bind( this ) );
    }

    onchange( e: Event ) {
      this.sendNext( e );
    }

  }

  export
  class OnlyKey extends r.Extension<KeyboardEvent, KeyboardEvent> {
    constructor( private keyCode: number ) {
      super();
    }

    onNext( e: KeyboardEvent ) {
      if (e.keyCode == this.keyCode) {
        this.sendNext( e );
      }
    }
  }

}
