/*####################################################################
 * The ComponentBuilder class.
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  /*================================================================
   * The ComponentBuilder class represents our embedded-DSL for
   * creating components.
   *
   * The various factory methods spend a lot of time validating
   * parameters and massaging them to fit the parameters of the actual
   * object constructors.  (The object constructors themselves assume
   * all parameters have been validated and are in the expected
   * format.)
   */
  export
  class ComponentBuilder {

    // The spec we are building
    private
    target: ComponentSpec = {
      constants:   [],
      variables:   [],
      nesteds:     [],
      references:  [],
      constraints: [],
      commands:    [],
      outputs:     [],
      touchDeps:   []
    };

    // If the last thing created was a constraint or a method in a
    // constraint, this will point to the constraint; otherwise it
    // will be null
    lastConstraint: ConstraintSpec = null;

    // If the last thing created was one or more variables, this will
    // point to the variables; otherwise it will be null
    lastVariables: (VariableSpec | VariableSpec[]) = null;

    usedLocs: u.Dictionary<boolean> = {};

    /*----------------------------------------------------------------
     * Get the spec constructed by this builder
     */
    spec() {
      this.endAll();
      return this.target;
    }

    /*----------------------------------------------------------------
     * Get a component made according to the spec
     */
    component( init?: u.Dictionary<any> ) {
      this.endAll();
      return new Component( this.target, init );
    }

    /*----------------------------------------------------------------
     * Add a constant.
     */
    constant( loc: string, value: any ): ComponentBuilder {
      this.target.constants.push( {loc: loc, value: value} );
      return this;
    }

    /*----------------------------------------------------------------
     * Add a variable.
     */
    v: <T>(loc: string, init?: T, eq?: u.EqualityPredicate<T> ) => ComponentBuilder;
    variable<T>( loc: string,
                 init?: T,
                 eq?: u.EqualityPredicate<T> ): ComponentBuilder {
      this.endAll();

      if (this.invalidLoc( loc )) { return this; }

      if (eq && typeof eq !== 'function') {
        console.error( "Variable equality predicate must be a function" );
        return this;
      }

      var vspec = { loc: loc, init: init, optional: Optional.Default, eq: eq};
      this.target.variables.push( vspec );
      this.usedLocs[loc] = true;
      this.lastVariables = vspec;

      return this;
    }

    /*----------------------------------------------------------------
     * This convenience method allows the creation of a bunch of
     * variables at once.
     */
    vs: ( a: string|u.Dictionary<any>, b?: u.Dictionary<any> ) => ComponentBuilder;
    variables( varorder: string, vardefs?: u.Dictionary<any> ): ComponentBuilder;
    variables( vardefs: u.Dictionary<any> ): ComponentBuilder;
    variables() {
      this.endAll();

      var varorder: string[];
      var vardefs: u.Dictionary<any>;
      var output: boolean;
      if (typeof arguments[0] === 'string') {
        varorder = arguments[0].trim().split( /\s*,\s*/ );
        vardefs = arguments[1] || {};
      }
      else {
        vardefs = arguments[0];
        varorder = Object.keys( vardefs );
      }

      var vspecs: VariableSpec[] = [];
      for (var i = 0, l = varorder.length; i < l; ++i) {
        var loc = varorder[i];
        this.variable( loc, vardefs[loc] );
        if (this.lastVariables) {
          vspecs.push( <VariableSpec>this.lastVariables );
        }
      }
      this.lastVariables = vspecs.length > 0 ? vspecs : null;

      return this;
    }

    /*----------------------------------------------------------------
     * Add a nested component.
     */
    n: (loc: string, klass: {new (): Component}, spec?: ComponentSpec) => ComponentBuilder;
    nested( loc: string, cmpType?: ComponentSpec ): ComponentBuilder {
      this.endAll();

      if (this.invalidLoc( loc )) { return this; }

      this.target.nesteds.push( {loc: loc, cmpType: cmpType} );
      this.usedLocs[loc] = true;

      return this;
    }

    /*----------------------------------------------------------------
     * Add a reference.
     */
    r: (loc: string, eq?: u.EqualityPredicate<any> ) => ComponentBuilder;
    reference( loc: string, eq?: u.EqualityPredicate<any> ): ComponentBuilder {
      this.endAll();

      if (this.invalidLoc( loc )) { return this; }

      this.target.references.push( {loc: loc, eq: eq} );
      this.usedLocs[loc] = true;

      return this;
    }

    /*----------------------------------------------------------------
     * Convenience method for many references at once
     */
    references( locs: string ): ComponentBuilder {
      locs.trim().split( /\s*,\s*/ ).forEach( function( loc: string ) {
        this.reference( loc )
      }, this );
      return this;
    }

    /*----------------------------------------------------------------
     * Add a constraint to the property modelcule.
     */
    c: ((signature: string) => ComponentBuilder);
    constraint( loc: string, signature: string ): ComponentBuilder;
    constraint( signature: string ): ComponentBuilder;
    constraint(): ComponentBuilder {
      this.endAll();

      var loc: string, signature: string;
      if (arguments.length > 1) {
        loc = arguments[0];
        signature = arguments[1];
      }
      else {
        signature = arguments[0];
      }

      var p = parseConstraint( signature );
      if (p == null) { return this; }

      if (p.constraintVars.some( invalidPath ) ||
          (p.touchVars && p.touchVars.some( invalidPath ))) {
         return this;
       }

      this.lastConstraint = {variables: p.constraintVars,
                             methods: [],
                             optional: Optional.Default};
      if (p.touchVars) {
        this.lastConstraint.optional = Optional.Max;
        this.lastConstraint.touchVariables = p.touchVars;
      }

      if (loc && ! this.invalidLoc( loc )) {
        this.lastConstraint.loc = loc;
        this.usedLocs[this.lastConstraint.loc] = true;
      }

      return this;
    }

    // Complete the current constraint; no effect if no current constraint
    endConstraint(): ComponentBuilder {
      if (this.lastConstraint) {
        this.target.constraints.push( this.lastConstraint );
        this.lastConstraint = null;
      }
      return this;
    }

    endVariables(): ComponentBuilder {
      this.lastVariables = null;
      return this;
    }

    endAll(): ComponentBuilder {
      this.endConstraint();
      this.endVariables();
      return this;
    }

    /*----------------------------------------------------------------
     * Add a method
     */
    m: (signature: string, fn: Function, lift?: boolean ) => ComponentBuilder;
    method( signature: string, fn: Function, lift = true ): ComponentBuilder {
      if (! this.lastConstraint) {
        console.error( 'Builder function "method" called with no constraint' );
        return this;
      }

      var p = parseActivation( 'method', signature );
      if (p == null) { return this; }

      // helper function to make sure variable belongs to constraint
      var constraintVars = this.lastConstraint.variables;
      var isNotConstraintVar = function( name: string, i: number ) {
        if ((! p.priorFlags || ! p.priorFlags[i]) &&
            constraintVars.indexOf( name ) < 0) {
          console.error( "Variable " + name +
                         " does not belong to constraint in method " + signature );
          return true;
        }
        else { return false; }

      };

      if (u.multiArray.some( p.inputs, isNotConstraintVar ) ||
          u.multiArray.some( p.outputs, isNotConstraintVar )) {
        return this;
      }

      u.arraySet.addKnownDistinct( this.lastConstraint.methods, {
        inputs: p.inputs,
        priorFlags: p.priorFlags,
        outputs: p.outputs,
        fn: lift ? r.liftFunction( fn, p.promiseFlags ) : fn
      } );

      return this;
    }

    /*----------------------------------------------------------------
     * Change optional policy on last constraint or variable.
     */
    optional( opt: Optional = Optional.Max ) {
      if (this.lastConstraint) {
        this.lastConstraint.optional = opt;
      }
      else if (this.lastVariables) {
        if (Array.isArray( this.lastVariables )) {
          var a = <VariableSpec[]>this.lastVariables;
          for (var i = 0, l = a.length; i < l; ++i) {
            a[i].optional = opt;
          }
        }
        else {
          (<VariableSpec>this.lastVariables).optional = opt;
        }
      }
      else {
        console.error( "Call to optional must follow constraint or variable" );
      }
      return this;
    }

    /*----------------------------------------------------------------
     */
    command(
      loc: string,
      signature: string,
      fn: Function,
      lift = true,
      sync = false
    ): ComponentBuilder {

      this.endAll();

      if (this.invalidLoc( loc )) { return this; }

      var p = parseActivation( 'command', signature );
      if (p == null) { return this; }

      if (u.multiArray.some( p.inputs, invalidPath ) ||
          u.multiArray.some( p.outputs, invalidPath )) {
        return this;
      }

      this.target.commands.push( {
        loc: loc,
        inputs: p.inputs,
        priorFlags: p.priorFlags,
        outputs: p.outputs,
        fn: lift ? r.liftFunction( fn, p.promiseFlags ) : fn,
        synchronous: sync
      } );

      return this;
    }

    //--------------------------------------------
    syncommand( loc: string, signature: string, fn: Function, lift = true ): ComponentBuilder {
      return this.command( loc, signature, fn, lift, true );
    }

    /*----------------------------------------------------------------
     * Add output designation
     */
    output( variable: string ): ComponentBuilder {
      this.endAll();
      if (invalidPath( variable )) {
        return this;
      }
      this.target.outputs.push( {variable: variable} );
      return this;
    }

    /*----------------------------------------------------------------
     * Convenience method for many outputs at once
     */
    outputs( variables: string ): ComponentBuilder {
      variables.trim().split( /\s*,\s*/ ).forEach( this.output, this );
      return this;
    }

    /*----------------------------------------------------------------
     * Add a touch dependency
     */
    touchDep( signature: string ): ComponentBuilder;
    touchDep( from: string, to: string ): ComponentBuilder;
    touchDep() {
      this.endAll();
      var from: string, to: string;
      if (arguments.length == 1) {
        var split = (<string>arguments[0]).trim().split( /\s*=>\s*/ );
        if (split.length == 2) {
          from = split[0];
          to = split[1];
        }
        else {
          console.error( 'Invalid touch dependency signature: "' + arguments[0] + '"' );
          return this;
        }
      }
      else {
        from = arguments[0];
        to = arguments[1];
      }
      if (invalidPath( from ) || invalidPath( to )) {
        return this;
      }
      this.target.touchDeps.push( {from: from, to: to} );
      return this;
    }

    /*----------------------------------------------------------------
     * Build constraint represented by simple equation.
     */
    equation( eqString: string ): ComponentBuilder {
      this.endAll();

      // Parse the equation
      try {
        var equation = eqn.parse( eqString );

        // Check variables
        var varNames = Object.keys( equation.vars );
        if (varNames.some( invalidPath )) {
          return this;
        }

        // Create constraint spec
        var cspec: ConstraintSpec = {
          variables: varNames,
          methods: [],
          optional: Optional.Default
        };

        var outName: string;
        var notOutput = function( name: string ) {
          return name !== outName;
        };

        for (var i = 0, l = varNames.length; i < l; ++i) {
          outName = varNames[i];

          var inNames: string[];
          var priorFlags: boolean[] = undefined;
          if (equation.op === '==') {
            inNames = varNames.filter( notOutput );
          }
          else {
            inNames = varNames;
            priorFlags = [];
            priorFlags[i] = true;
          }

          // Make signature
          var signature = inNames.join( ',' ) + '->' + outName;

          // Build method function
          var fn = eqn.makeFunction( inNames, outName, equation );

          // Create method spec
          var mspec: MethodSpec = {
            inputs: inNames,
            outputs: [outName],
            priorFlags: priorFlags,
            fn: r.liftFunction( fn )
          };

          // Add method to constraint
          u.arraySet.addKnownDistinct( cspec.methods, mspec );
        }

        // Record constraint
        this.target.constraints.push( cspec );
      }
      catch (e) {
        console.error( e );
      }

      return this;
    }

    /*----------------------------------------------------------------
     * Test for invalid property name
     */
    private
    invalidLoc( loc: string ): boolean {
      if (! loc.match( /^[a-zA-Z][\w$]*$/ )) {
        console.error( 'Invalid component property name: "' + loc + '"' );
        return true;
      }
      if (this.usedLocs[loc]) {
        console.error( 'Cannot redefine component property: "' + loc + '"' );
        return true;
      }
      return false;
    }
  }

  (<any>ComponentBuilder).prototype['v']   = ComponentBuilder.prototype.variable;
  (<any>ComponentBuilder).prototype['vs']  = ComponentBuilder.prototype.variables;
  (<any>ComponentBuilder).prototype['n']   = ComponentBuilder.prototype.nested;
  (<any>ComponentBuilder).prototype['r']   = ComponentBuilder.prototype.reference;
  (<any>ComponentBuilder).prototype['rs']  = ComponentBuilder.prototype.references;
  (<any>ComponentBuilder).prototype['c']   = ComponentBuilder.prototype.constraint;
  (<any>ComponentBuilder).prototype['m']   = ComponentBuilder.prototype.method;
  (<any>ComponentBuilder).prototype['cmd'] = ComponentBuilder.prototype.command;
  (<any>ComponentBuilder).prototype['o']   = ComponentBuilder.prototype.output;
  (<any>ComponentBuilder).prototype['os']  = ComponentBuilder.prototype.outputs;
  (<any>ComponentBuilder).prototype['td']  = ComponentBuilder.prototype.touchDep;
  (<any>ComponentBuilder).prototype['eq']  = ComponentBuilder.prototype.equation;

  /*==================================================================
   * Test for invalid variable path
   */
  var pathRegEx = /^[a-zA-Z][\w$]*(\.[a-zA-Z][\w$]*|\[\s*(\d+|\*)\s*\]|\[\s*(\d+\s*)?[a-zA-Z][\w$]*\s*([+-]\s*\d+\s*)?\])*$/;

  function invalidPath( path: string ): boolean {
    if (! path.match( pathRegEx )) {
      console.error( 'Invalid variable path: "' + path + '"' );
      return true;
    }
    return false;
  }

  /*==================================================================
   */
  function parseConstraint( signature: string ) {
    var touchVars: string[];
    var constraintVars: string[];
    var leftRight = signature.trim().split( /\s*=>\s*/ );
    if (leftRight.length == 1) {
      constraintVars = leftRight[0].split( /\s*,\s*/ );
    }
    else if (leftRight.length == 2) {
      touchVars = leftRight[0].split( /\s*,\s*/ );
      constraintVars = leftRight[1].split( /\s*,\s*/ );
    }
    else {
      console.error( 'Invalid constraint signature: "' + signature + '"' );
      return null;
    }
    return {touchVars: touchVars,
            constraintVars: constraintVars};
  }

  /*==================================================================
   */
  function parseActivation( description: string, signature: string ) {
    var leftRight = signature.trim().split( /\s*->\s*/ );
    if (leftRight.length != 2) {
      console.error( 'Invalid ' + description + ' signature: "' + signature + '"' );
      return null;
    }
    var inputs = leftRight[0] == '' ? [] : leftRight[0].split( /\s*,\s*/ );
    var outputs = leftRight[1] == '' ? [] : leftRight[1].split( /\s*,\s*/ );

    var promiseFlags: boolean[] = [];
    var priorFlags: boolean[] = [];
    for (var i = 0, l = inputs.length; i < l; ++i) {
      var stripResult = strip( inputs[i], ['*', '!'] );
      if (! stripResult) { return null; }
      inputs[i] = stripResult['name'];
      if (stripResult['*']) { promiseFlags[i] = true; }
      if (stripResult['!']) { priorFlags[i] = true; }
    }

    return {inputs: inputs,
            promiseFlags: promiseFlags.length == 0 ? null : promiseFlags,
            priorFlags: priorFlags.length == 0 ? null : priorFlags,
            outputs: outputs.length == 1 ? outputs : [outputs]
           };
  }

  export
  var tokensRegEx = /([\w$.]+(\[[^\]]*\][\w$.]*)*|\S)/g;

  export
  function parseList( tokens: string[], i: number, list: u.MultiArray<string> ) {
    do {
      if (tokens[i] === '[') {
        var sub: string[] = [];
        list.push( sub );
        i = parseList( tokens, i+1, sub );
        if (tokens[i++] !== ']') {
          throw 'Expecting "]"';
        }
      }
      else if (tokens[i] === ',' || tokens[i] === ']') {
        throw 'Unexpected token "' + tokens[i] + '"';
      }
      else {
        list.push( tokens[i++] );
      }
      var more = false;
      if (tokens[i] === ',') {
        ++i;
        more = true;
      }
    } while (more);
    return i;
  }

  /*================================================================
   * Strip one-character prefixes from front of names
   */
  function strip( name: string, prefixes: string[] ) {
    var result: u.Dictionary<any> = {};
    var c = name.charAt( 0 );
    while (! c.match( /\w/ )) {
      if (prefixes.indexOf( c ) >= 0) {
        if (result[c]) {
          console.error( 'Duplicate variable prefix: ' + c );
          return null;
        }
        result[c] = true;
      }
      else if (! c.match( /\s/ )) {
        console.error( 'Invalid variable prefix: ' + c );
        return null;
      }
      name = name.substring( 1 );
      c = name.charAt( 0 );
    }
    result['name'] = name;
    return result;
  }

}
