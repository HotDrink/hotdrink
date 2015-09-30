module hd.bindings {

  import u = hd.utility;
  import r = hd.reactive;

  export
  class Visible {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      this.el = checkHtml( el, HTMLElement );
    }

    onNext( value: u.Fuzzy ) {
      if (value) {
        this.el.style.visibility = 'visible';
      }
      else {
        this.el.style.visibility = 'hidden';
      }
    }

    onError() { }

    onCompleted() { }

  }

}