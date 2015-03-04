module hd.bindings {

  import u = hd.utility;

  export
  class Position {

    el: HTMLElement;

    constructor( el: HTMLElement ) {
      this.el = checkHtml( el, HTMLElement );
      el.style.position = 'absolute';
    }

    onNext( p: u.Point ) {
      this.el.style.left = p.x + 'px';
      this.el.style.top = p.y + 'px';
    }

    onError() { }

    onCompleted() { }
  }

}