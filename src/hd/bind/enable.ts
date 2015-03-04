module hd.bindings {

  import u = hd.utility;
  import r = hd.reactive;

  export
  class Enabled {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      this.el = checkHtml( el, HTMLElement );
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