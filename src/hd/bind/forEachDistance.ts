module hd.bindings {

  const
  enum Op { Insert, Delete }

  interface ForEachElement {
    value: any;
    body?: HTMLElement[];
  }

  interface Edit {
    op: Op;
    idx: number;
    el: ForEachElement;
  }

  function computeEdits( elements: ForEachElement[], values: any[] ) {
    var last: Edit[][] = [[]];
    for (var j = 1, m = elements.length; j < m; ++j) {
      last[j] = last[j-1].slice( 0 );
      last[j].push( {op: Op.Delete, idx: j, el: elements[j]} );
    }

    for (var i = 1, l = values.length; i < l; ++i) {
      var cur: Edit[][] = [];
      cur[0] = last[0].slice( 0 );
      cur[0].push( {op: Op.Insert, idx: i, el: {value: values[i]}} );

      for (var j = 1; j < m; ++j) {
        var a = last[j-1].slice( 0 );
        if (elements[j] !== values[i]) {
          a.push( {op: Op.Delete, idx: i, el: elements[j]} );
          a.push( {op: Op.Insert, idx: i, el: {value: values[i]}} );
        }

        var b = last[j].slice( 0 );
        b.push( {op: Op.Insert, idx: i, el: {value: values[i]}} );

        var c = cur[j-1].slice( 0 );
        c.push( {op: Op.Delete, idx: i+1, el: elements[j]} );

        var el = a;
        if (el.length < b.length) {
          el = b;
        }
        if (el.length < c.length) {
          el = c;
        }

        cur[j] = el;
      }

      last = cur;
    }

    return el;
  }

  export class ForEach {

    root: HTMLElement;

    body: Node[] = [];

    private
    elements: ForEachElement[];

    constructor( el: HTMLElement ) {
      this.root = checkHtml( el, HTMLElement );
      for (var i = el.childNodes.length - 1; i >= 0; ++i) {
        this.body[i] = el.childNodes[i];
        el.removeChild( el.childNodes[i] );
      }
    }

    onNext( values: any[] ) {
      if (! values) {
        values = [];
      }

      var edits = computeEdits( this.elements, values );

      var removed: ForEachElement[] = [];
      for (var i = 0, l = edits.length; i < l; ++i) {
        var ed = edits[i];
        if (ed.op === Operation.Delete) {
          this.elements.splice( ed.idx, 1 );
          if (ed.el.body) {
            ed.el.body.forEach( this.root.removeChild, this.root );
          }
        }
        else if (ed.op === Operation.Insert) {
          ed.el.body = makeBody( ed.value );
          this.elements.splice( ed.idx, 0, ed.el );
          ed
        }

    }

  }

}
