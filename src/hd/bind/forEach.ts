module hd.bindings {

  export class ForEach {

    root: HTMLElement;

    body: Node[] = [];

    constructor( el: HTMLElement ) {
      this.root = checkHtml( el, HTMLElement );
      for (var i = el.childNodes.length - 1; i >= 0; --i) {
        this.body[i] = el.childNodes[i];
        el.removeChild( el.childNodes[i] );
      }
    }

    onNext( values: any[] ) {
      while (this.root.lastChild) {
        this.root.removeChild( this.root.lastChild );
      }
      for (var i = 0, l = values.length; i < l; ++i) {
        var v = values[i];
        for (var j = 0, m = this.body.length; j < m; ++j) {
          var n = this.body[j].cloneNode( true );
          this.root.appendChild( n );
          performDeclaredBindings( v, <HTMLElement>n );
        }
      }
    }

    onError() { }

    onCompleted() { }
  }

}
