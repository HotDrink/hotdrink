module hd.config {
  export var bindAttr = 'data-bind';
  export var bindEnv  = 'bd';
}

module hd.bind {

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;

  /*==================================================================
   * Target can be either Observable or Observer or both
   */
  export
  interface Target {
    onNext?: ( value: any ) => void;
    onError?: ( error: any ) => void;
    onCompleted?: () => void;
    addObserver?: (observer: r.Observer<any>) => void;
    removeObserver?: (observer: r.Observer<any> ) => void;
  }

  /*==================================================================
   */

  export
  interface Scope { [name: string]: any }

  export
  function localScope( scope: Scope ): Scope {
    var local = Object.create( scope );
    return local;
  }

  /*==================================================================
   */
  export
  enum Direction { bi, v2m, m2v }

  export
  interface Binding {
    view: Target;
    model: Target;
    dir: Direction;
    toView?: (r.Extension<any,any>|r.Extension<any,any>[]);
    toModel?: (r.Extension<any,any>|r.Extension<any,any>[]);
    halt?: boolean;
  }

  interface VerifiedBinding {
    view: Target;
    model: Target;
    dir: Direction;
    toView?: r.Extension<any,any>;
    toModel?: r.Extension<any,any>;
    localize?: Function;
    halt?: boolean;
  }

  /*==================================================================
   * Safety functions -- these are basically run-time type checks:
   * checking that objects support the expected interfaces so that
   * we can give more helpful error messages.  (Otherwise the error
   * reported will be that we tried to call an undefined funciton in
   * our code.)
   */

  // Make sure element is required HTML
  export
  function checkHtml<T>( el: HTMLElement, type: u.Class<T> ): T {
    if (typeof el !== 'object' || ! (el instanceof type)) {
      throw type.name + " required";
    }
    return <any>el;
  }

  // Make sure object is observer
  export
  function isObserver( t: Target ): boolean {
    return (typeof t === 'object' &&
            typeof t.onNext === 'function');
  }

  // Make sure object is observable
  export
  function isObservable( t: Target ): boolean {
    return (typeof t === 'object' &&
            typeof t.addObserver === 'function' &&
            typeof t.removeObserver === 'function');
  }

  // Make sure object is both observable and observer
  export
  function isExtension( t: Target ): boolean {
    return (typeof t === 'object' &&
            typeof t.onNext === 'function' &&
            typeof t.addObserver === 'function' &&
            typeof t.removeObserver === 'function');
  }

  // Check each element of binding
  function verifyBinding( b: Binding ) {
    if (! b.model) {
      throw "no model specified";
    }
    if (! b.view) {
      throw "no view specified";
    }
    if (b.dir === undefined) {
      if (isObservable( b.model ) && isObserver( b.view )) {
        if (isObservable( b.view ) && isObserver( b.model )) {
          b.dir = Direction.bi;
        }
        else {
          b.dir = Direction.m2v;
        }
      }
      else {
        if (isObservable( b.view ) && isObserver( b.model )) {
          b.dir = Direction.v2m;
        }
        else {
          throw "unable to deduce binding direction";
        }
      }
    }
    else {
      if (b.dir != Direction.v2m) {
        if (! isObservable( b.model )) {
          throw "model not observable";
        }
        if (! isObserver( b.view )) {
          throw "view not observer";
        }
      }
      if (b.dir != Direction.m2v) {
        if (! isObservable( b.view )) {
          throw "view not observable";
        }
        if (! isObserver( b.model )) {
          throw "model not observer";
        }
      }
    }
    if (b.dir != Direction.v2m && b.toView) {
      if (Array.isArray( b.toView )) {
        var exts: r.Extension<any,any>[] = <any>b.toView;
        if (! exts.every( isExtension )) {
          throw "toView contains invalid extension";
        }
        b.toView = new r.Chain( exts );
      }
      else {
        if (! isExtension( b.toView )) {
          throw "toView is not extension";
        }
      }
    }
    if (b.dir != Direction.m2v && b.toModel) {
      if (Array.isArray( b.toModel )) {
        var exts: r.Extension<any,any>[] = <any>b.toModel;
        if (! exts.every( isExtension )) {
          throw "toModel contains invalid extension";
        }
        b.toModel = new r.Chain( exts );
      }
      else {
        if (! isExtension( b.toModel )) {
          throw "toModel is not extension";
        }
      }
    }
    return <VerifiedBinding>b;
  }

  /*==================================================================
   * Bind and unbind
   */

  export
  function createBindings( b: Binding|u.MultiArray<Binding> ) {
    if (Array.isArray( b )) {
      (<u.MultiArray<Binding>>b).forEach( createBindings )
    }
    else {
      bindSingle( <Binding>b );
    }
  }

  function bindSingle( b: Binding ) {
    var vb = verifyBinding( b );
    if (vb.dir != Direction.v2m) {
      if (vb.toView) {
        vb.toView.addObserver( <r.Observer<any>>vb.view );
        vb.model.addObserver( vb.toView );
      }
      else {
        vb.model.addObserver( <r.Observer<any>>vb.view );
      }
    }
    if (vb.dir != Direction.m2v) {
      if (vb.toModel) {
        vb.view.addObserver( vb.toModel );
        vb.toModel.addObserver( <r.Observer<any>>vb.model );
      }
      else {
        vb.view.addObserver( <r.Observer<any>>vb.model );
      }
    }
  }

  /*----------------------------------------------------------------*/

  export
  function destroyBindings( b: Binding|u.MultiArray<Binding> ) {
    if (Array.isArray( b )) {
      (<u.MultiArray<Binding>>b).forEach( destroyBindings )
    }
    else {
      unbindSingle( <Binding>b );
    }
  }

  function unbindSingle( b: Binding ) {
    var vb = verifyBinding( b );
    if (vb.dir != Direction.v2m) {
      if (vb.toView) {
        vb.model.removeObserver( vb.toView );
        vb.toView.removeObserver( <r.Observer<any>>vb.view );
      }
      else {
        vb.model.removeObserver( <r.Observer<any>>vb.view );
      }
    }
    if (vb.dir != Direction.m2v) {
      if (vb.toModel) {
        vb.view.removeObserver( vb.toModel );
        vb.toModel.removeObserver( <r.Observer<any>>vb.model );
      }
      else {
        vb.view.removeObserver( <r.Observer<any>>vb.model );
      }
    }
  }

  /*==================================================================
   * Search DOM tree for binding specifications and perform them.
   */

  /*------------------------------------------------------------------
   * Entry point
   */
  export
  function createDeclaredBindings(
    scope: Scope,
    el =   document.body
  ):       Binding[] {

    var bindings: Binding[] = [];
    if (el.nodeType === Node.ELEMENT_NODE) {
      searchForBindings( el, scope, bindings );
    }
    return bindings;
  }


  /*------------------------------------------------------------------
   * Recursive search function.
   */
  function searchForBindings(
    el: HTMLElement,
    scope: Scope,
    bindings: Binding[] ) {

    // Look for declarative binding specification
    var spec = el.getAttribute( config.bindAttr );
    var halt = false;
    if (spec) {
      halt = bindElement( spec, el, scope, bindings );
    }

    if (! halt) {
      for (var i = 0, l = el.childNodes.length; i < l; ++i) {
        if (el.childNodes[i].nodeType === Node.ELEMENT_NODE) {
          searchForBindings( <HTMLElement>el.childNodes[i], scope, bindings );
        }
      }
    }
  }

  /*------------------------------------------------------------------
   * Attempt to bind one single element from specification.
   */
  function bindElement(
    spec:     string,
    el:       HTMLElement,
    scope:    Scope,
    bindings: Binding[]
  ):          boolean {

    // Eval binding string as JS
    try {
      var functionBody = compile( spec );
      var elBindingsFn = new Function( config.bindEnv, functionBody );
      var env = new BindEnvironment( el, scope );
      var elNestedBindings: u.MultiArray<Binding> = elBindingsFn.call( null, env );
    }
    catch (e) {
      console.error( "Invalid binding declaration: " + spec, e );
      return false;
    }

    var halt = false;
    var i = 0;

    u.multiArray.forEach( elNestedBindings, function( b: Binding ) {
      halt = halt || b.halt;
      try {
        bindSingle( b );
        bindings.push( b );
      }
      catch (e) {
        console.error( 'Invalid binding ' + i + ': ' + spec, e );
      }
      ++i;
    } );

    return halt;
  }

  /*------------------------------------------------------------------
   * Compile binding specification string to function which produces
   * the specification object.
   *
   * Very straightforward for now.  Later we might try to support some
   * of the constructs John implemented.
   */
  function compile( spec: string ): string {
    return "with (" + config.bindEnv + ".scope) {" +
           "  return [" + spec + "]" +
           "}";
  }

}
