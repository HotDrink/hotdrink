module hd.bind {

  import r = hd.reactive;

  export
  class MouseDown extends r.BasicObservable<MouseEvent> {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLElement );
      this.el.addEventListener( 'mousedown', this.onmousedown.bind( this ) );
    }

    onmousedown( e: MouseEvent ) {
      this.sendNext( e );
    }
  }

  export
  class MouseUp extends r.BasicObservable<MouseEvent> {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLElement );
      this.el.addEventListener( 'mouseup', this.onmouseup.bind( this ) );
    }

    onmouseup( e: MouseEvent ) {
      this.sendNext( e );
    }
  }

  export
  class Click extends r.BasicObservable<MouseEvent> {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLElement );
      this.el.addEventListener( 'click', this.onclick.bind( this ) );
    }

    onclick( e: MouseEvent ) {
      this.sendNext( e );
    }
  }

  export
  class DblClick extends r.BasicObservable<MouseEvent> {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLElement );
      this.el.addEventListener( 'dblclick', this.ondblclick.bind( this ) );
    }

    ondblclick( e: MouseEvent ) {
      this.sendNext( e );
    }
  }

}
