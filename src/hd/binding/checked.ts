module hd.binding {

  import r = hd.reactive;
  import m = hd.model;

  export
  class Checked extends r.BasicObservable<boolean> {
    el: HTMLInputElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = checkHtml( el, HTMLInputElement );
      var boundUpdate = this.update.bind( this );
      el.addEventListener( 'input', boundUpdate );
      el.addEventListener( 'change', boundUpdate );
    }

    update() {
      this.sendNext( this.el.checked );
    }

    onNext( value: boolean ) {
      this.el.checked = !!value;
    }

    onError() { }

    onCompleted() { }
  }

}
