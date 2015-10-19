module hd.binding {

  import u = hd.utility;
  import r = hd.reactive;

  export
  class Enabled {

    el: HTMLInputElement;

    constructor( el: HTMLElement ) {
      this.el = <HTMLInputElement>checkHtml( el, HTMLElement );
    }

    onNext( value: u.Fuzzy ) {
      if (value) {
        this.el.disabled = false;
      }
      else {
        this.el.disabled = true;
      }
    }

    onError() { }

    onCompleted() { }

  }

}
