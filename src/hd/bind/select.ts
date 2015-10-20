module hd.bind {

  import console         = hd.utility.console;
  import BasicObservable = hd.reactive.BasicObservable;
  import Variable        = hd.model.Variable;

  interface Option {
    id: string;
    label?: string;
  }

  class Options {

    el: HTMLSelectElement;

    constructor( el: HTMLSelectElement ) {
      this.el = el;
    }

    onNext( value: Option[] ) {
      var el = this.el;
      while (el.lastChild) {
        el.removeChild( el.lastChild );
      }
      value.forEach( function( entry: Option ) {
        var option = document.createElement( 'option' );
        option.value = entry.id;
        option.text = entry.label ? entry.label : entry.id;
        el.appendChild( option );
      } );
      var evt = document.createEvent( 'HTMLEvents' );
      evt.initEvent("change", false, true);
      this.el.dispatchEvent( evt );
    }

    onError() { }

    onCompleted() { }

  }

  /*******************************************************************
   */

  export
  class Value extends BasicObservable<any> {
    el: HTMLSelectElement;

    constructor( el: HTMLElement ) {
      super();
      this.el = <any>checkHtml( el, HTMLElement );
      if (el) {
        var boundUpdate = this.update.bind( this );
        el.addEventListener( 'input', boundUpdate );
        // el.addEventListener( 'change', boundUpdate );
      }
    }

    update() {
      this.sendNext( this.el.value );
    }

    onNext( value: string ) {
      if (value) {
        this.el.value = value;
      }
    }

    onError() { }

    onCompleted() { }

  }


}
