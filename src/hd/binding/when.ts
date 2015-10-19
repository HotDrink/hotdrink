module hd.binding {

  export
  class When {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      this.el = checkHtml( el, HTMLElement );
    }

    onNext( value: boolean ) {
      if (value) {
        this.el.style.removeProperty( 'display' );
      }
      else {
        this.el.style.display = 'none';
      }
    }

    onError() { }

    onCompleted() { }

  }

}
