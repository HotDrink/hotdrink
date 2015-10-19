/*####################################################################
 * Binding for CSS class name.  Takes boolean observable and two
 * css class names: one for when the observable is true, and one for
 * when it's false.  If a class name evaluates to false, then no
 * class is used for that value.
 */
module hd.binding {

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;

  export
  class CssClass {

    // Element bound to
    el: HTMLElement;

    // CSS class name when true
    trueClass: string;

    // CSS class name when false
    falseClass: string;

    /*----------------------------------------------------------------
     * Initialize
     */
    constructor( trueClass: string, falseClass: string, el: HTMLElement ) {
      this.el = el;
      this.trueClass = trueClass;
      this.falseClass = falseClass;
    }

    /*----------------------------------------------------------------
     * Observe variable
     */
    onNext( value: boolean ) {
      if (value) {
        if (this.falseClass) {
          this.el.classList.remove( this.falseClass );
        }
        if (this.trueClass) {
          this.el.classList.add( this.trueClass );
        }
      }
      else {
        if (this.trueClass) {
          this.el.classList.remove( this.trueClass );
        }
        if (this.falseClass) {
          this.el.classList.add( this.falseClass );
        }
      }
    }

    onError() { }

    onCompleted() { }

  }

}
