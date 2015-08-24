module hd.bindings {
  import u = hd.utility;

  export class ForEach {

    root: HTMLElement;

    body: Node[] = [];

    scope: Scope;

    name: string;

    constructor( name: string, el: HTMLElement, scope: Scope ) {
      this.name = name;
      this.root = checkHtml( el, HTMLElement );
      this.scope = scope;
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
          var local = localScope( this.scope );
          local[this.name] = v;
          performDeclaredBindings( local, <HTMLElement>n );
        }
      }
    }

    onError() { }

    onCompleted() { }
  }

}
