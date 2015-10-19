/*####################################################################
 * Binding which simply inserts value as text in an element.
 */

module hd.binding {

  import u = hd.utility;
  import m = hd.model;

  /*==================================================================
   * Observer for binding
   */
  export
  class Text {

    // element bound to
    el: HTMLElement;

    // initialize
    constructor( el: HTMLElement ) {
      this.el = checkHtml( el, HTMLElement );
    }

    /*----------------------------------------------------------------
     * Observe variable
     */
    onNext( value: string ) {
      if (value === undefined || value === null) {
        value = '';
      }

      var el = this.el;
      while (el.lastChild) {
        el.removeChild( el.lastChild );
      }
      el.appendChild( document.createTextNode( value ) );
    }

    onError() { }

    onCompleted() { }

  }

}
