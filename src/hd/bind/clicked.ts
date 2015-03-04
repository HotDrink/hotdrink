module hd.bindings {

  import r = hd.reactive;

  export
  class Clicked extends r.BasicObservable<any> {

    value: any;
    el: HTMLElement;

    constructor( value: any, el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLElement );
      this.value = value;

      el.addEventListener( 'click', this.update.bind( this ) );
    }

    update() {
      this.sendNext( this.value );
    }
  }

}