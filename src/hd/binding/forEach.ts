module hd.binding {
  import u = hd.utility;
  import r = hd.reactive;

  export
  class ForEach {

    root: HTMLElement;

    body: Node[] = [];

    scope: Scope;

    name: string;
    idxName: string;

    constructor( el: HTMLElement, scope: Scope, name: string, idxName: string ) {
      this.name = name;
      this.idxName = idxName;
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
        var local = localScope( this.scope );
        var el = local['$'+this.name] = new r.Constant( null );
        if (this.idxName) {
          var idx = local['$'+this.idxName] = new r.Constant( 0 );
        }
        for (var j = 0, m = this.body.length; j < m; ++j) {
          var n = this.body[j].cloneNode( true );
          this.root.appendChild( n );
          local[this.name] = v;
          el.value = v;
          if (this.idxName) {
            local[this.idxName] = i;
            idx.value = i;
          }
          createDeclaredBindings( local, <HTMLElement>n );
        }
      }
    }

    onError() { }

    onCompleted() { }
  }

}
