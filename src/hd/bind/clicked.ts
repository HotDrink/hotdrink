module hd.bindings {

  import r = hd.reactive;

  export
  class MouseDown extends r.BasicObservable<any> {

    value: any;
    el: HTMLElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLElement );
      this.el.addEventListener( 'mousedown', this.onmousedown.bind( this ) );
    }

    onmousedown( e: Event ) {
      this.sendNext( e );
    }
  }

  export
  class MouseUp extends r.BasicObservable<any> {

    value: any;
    el: HTMLElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLElement );
      this.el.addEventListener( 'mouseup', this.onmouseup.bind( this ) );
    }

    onmouseup( e: Event ) {
      this.sendNext( e );
    }
  }

  export
  class Click extends r.BasicObservable<any> {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLElement );
      this.el.addEventListener( 'click', this.onclick.bind( this ) );
    }

    onclick( e: Event ) {
      this.sendNext( e );
    }
  }

  export
  class DblClick extends r.BasicObservable<any> {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLElement );
      this.el.addEventListener( 'dblclick', this.ondblclick.bind( this ) );
    }

    ondblclick( e: Event ) {
      this.sendNext( e );
    }
  }

}
