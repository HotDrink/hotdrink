/*####################################################################
 * The ModelBuilder class.
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  /*==================================================================
   * The purpose of the ModelBuilder is to make it easy for
   * programmers to construct modelcules.
   *
   * The various factory methods spend a lot of time validating
   * parameters and massaging them to fit the parameters of the actual
   * object constructors.  (The object constructors themselves assume
   * all parameters have been validated and are in the expected
   * format.)
   */
  export class ModelBuilder {

    // The modelcule we are building
    target: Modelcule;

    // If the last thing created was a constraint or a method in a
    // constraint, this will point to the constraint; otherwise it
    // will be null
    last: ConstraintTemplate = null;

    /*----------------------------------------------------------------
     * Can either take an existing modelcule and expand on it, or create a
     * brand new modelcule.
     */
    constructor( modelcule?: Modelcule ) {
      if (modelcule) {
        this.target = modelcule;
      }
      else {
        this.target = new Modelcule();
      }
    }

    /*----------------------------------------------------------------
     * Get the modelcule that was built.
     */

    end() {
      this.endConstraint();
      return this.target;
    }

    /*----------------------------------------------------------------
     * Add a variable to the current modelcule.
     */
    variable<T>( name: string,
                 init?: T,
                 eq?: u.EqualityPredicate<T>,
                 output?: boolean             ): ModelBuilder {
      this.endConstraint();

      var indirect = false;
      var stripped = stripDollar( name );
      if (stripped) {
        indirect = true;
        name = stripped;
      }

      if (this.invalidName( name ) || this.nameInUse( name )) { return this; }

      if (eq && typeof eq !== 'function') {
        console.error( 'Variable equality predicate must be a function' );
        return this;
      }

      // Check to see if init is really the variable we should use
      var vv: Variable;
      if (init instanceof Variable) {
        vv = <any>init;
        init = undefined;
      }

      // Create the variable template
      var template: VariableTemplate = {
        name: name,
        ref: indirect,
        value: init,
        eq: eq,
        output: output
      }

      // Add variable
      Modelcule.addVariableTemplate( this.target, template, vv );

      return this;
    }

    /*----------------------------------------------------------------
     * This convenience method allows the creation of a bunch of
     * variables at once -- stored in an object as name/init pairs.
     */
    variables( varorder: string, vardefs?: u.Dictionary<any>, output?: boolean ): ModelBuilder;
    variables( vardefs: u.Dictionary<any>, output?: boolean ): ModelBuilder;
    variables() {
      this.endConstraint();

      var varorder: string[];
      var vardefs: u.Dictionary<any>;
      var output: boolean;
      if (typeof arguments[0] === 'string') {
        varorder = arguments[0].trim().split( /\s*,\s*/ );
        vardefs = arguments[1] || {};
        output = arguments[2];
      }
      else {
        vardefs = arguments[0];
        varorder = Object.keys( vardefs );
        output = arguments[1];
      }

      varorder.forEach( function( name: string ) {
        this.variable( name, vardefs[name], undefined, output );
      }, this );

      return this;
    }

    /*----------------------------------------------------------------
     * Add a variable to current model, marking it as output.
     *   -OR-
     * Mark existing variable as output
     */
    outputVariable<T>( name: string, init?: T, eq?: u.EqualityPredicate<T> ): ModelBuilder {
      this.endConstraint();

      if (arguments.length == 1 && this.target[name] instanceof Variable) {
        (<Variable>this.target[name]).setOutput( true );
      }
      else {
        this.variable( name, init, eq, true );
      }
      return this;
    }

    interfaceVariable<T>( name: string, init?: T, eq?: u.EqualityPredicate<T> ): ModelBuilder {
      this.endConstraint();

      if (arguments.length == 1 && this.target[name] instanceof Variable) {
        (<Variable>this.target[name]).setOutput( false );
      }
      else {
        this.variable( name, init, eq, false );
      }
      return this;
    }

    /*----------------------------------------------------------------
     * This convenience method allows the creation of a bunch of
     * output variables at once
     *   -OR-
     * Marking a group of existing variables as output
     */
    outputVariables( varorder: string, vardefs?: u.Dictionary<any> ): ModelBuilder;
    outputVariables( vardefs: u.Dictionary<any> ): ModelBuilder;
    outputVariables() {
      this.endConstraint();

      if (arguments.length == 1 && typeof arguments[0] === 'string') {
        arguments[0].trim().split( /\s*,\s*/ ).forEach( function( name: string ) {
          this.outputVariable( name );
        }, this );
      }
      else if (arguments.length > 1) {
        this.variables( arguments[0], arguments[1], true );
      }
      else {
        this.variables( arguments[0], true );
      }
      return this;
    }

    interfaceVariables( varorder: string, vardefs?: u.Dictionary<any> ): ModelBuilder;
    interfaceVariables( vardefs: u.Dictionary<any> ): ModelBuilder;
    interfaceVariables<T>(): ModelBuilder {
      this.endConstraint();

      if (arguments.length == 1 && typeof arguments[0] === 'string') {
        arguments[0].trim().split( /\s*,\s*/ ).forEach( function( name: string ) {
          this.interfaceVariable( name )
        }, this );
      }
      else if (arguments.length > 1) {
        this.variables( arguments[0], arguments[1], false );
      }
      else {
        this.variables( arguments[0], false );
      }
      return this;
    }

    /*----------------------------------------------------------------
     * Add a method to the current modelcule.
     */
    asyncMethod( signature: string, fn: Function ): ModelBuilder {
      return this.method( signature, fn, true );
    }

    method( signature: string, fn: Function, async = false ): ModelBuilder {

      // Break down signature
      var leftRight = signature.trim().split( /\s*->\s*/ );
      if (leftRight.length != 2) {
        console.error( 'Invalid method signature: "' + signature + '"' );
        return this;
      }
      var inputs = leftRight[0] == '' ? [] : leftRight[0].split( /\s*,\s*/ );
      var outputs = leftRight[1] == '' ? [] : leftRight[1].split( /\s*,\s*/ );

      // Translate any '*' to mask
      var mask: boolean[] = [];
      for (var i = 0, l = inputs.length; i < l; ++i) {
        var stripped = stripStar( inputs[i] );
        if (stripped) {
          mask[i] = true;
          inputs[i] = stripped;
        }
      }
      if (mask.length == 0) {
        mask = null;
      }

      // Make sure all variables are in constraint
      var constraintVars = this.last.variables;
      var isNotConstraintVar = function( name: string ) {
        return constraintVars.indexOf( name ) < 0;
      };

      if (inputs.some( isNotConstraintVar )) {
        console.error( "Input does not belong to constraint in method " + signature );
        return this;
      }
      if (outputs.some( isNotConstraintVar )) {
        console.error( "Output does not belong to constraint in method " + signature );
        return this;
      }

      // Create method template
      var template: MethodTemplate = {
        inputs: inputs,
        outputs: outputs,
        fn: async ? fn : r.liftFunction( fn, outputs.length, mask )
      };

      u.arraySet.addKnownDistinct( this.last.methods, template );

      return this;
    }

    /*----------------------------------------------------------------
     * Add a constraint to the property modelcule.
     */
    constraint( signature: string ): ModelBuilder {
      this.endConstraint();

      var varNames = signature.trim().split( /\s*,\s*/ );

      if (varNames.some( this.invalidPath, this )) {
        return this;
      }

      // Create constraint template
      var template: ConstraintTemplate = {
        variables: varNames,
        methods: []
      };

      // Record constraint
      this.last = template;

      return this;
    }

    endConstraint(): ModelBuilder {
      if (this.last) {
        Modelcule.addConstraintTemplate( this.target, this.last );
        this.last = null;
      }
      return this;
    }

    /*----------------------------------------------------------------
     * Build constraint represented by simple equation.
     */
    equation( eqString: string ): ModelBuilder {
      this.endConstraint();

      // Parse the equation
      try {
        var equation = eqn.parse( eqString );

        // Check variables
        var varNames = Object.keys( equation.vars );
        if (varNames.some( this.invalidPath, this )) {
          return this;
        }

        // Create constraint template
        var ctmpl: ConstraintTemplate = {
          variables: varNames,
          methods: []
        };

        var allNames = varNames.join( ',' );
        var outName: string;
        var notOutput = function( name: string ) {
          return name !== outName;
        };

        for (var i = 0, l = varNames.length; i < l; ++i) {
          // Partition input/output names
          outName = varNames[i];

          // Make signature
          var signature = [allNames, outName].join( '->' );

          // Build method function
          var fn = eqn.makeFunction( varNames, outName, equation );

          // Create method template
          var mtmpl: MethodTemplate = {
            inputs: varNames,
            outputs: [outName],
            fn: r.liftFunction( fn )
          };

          // Add method to constraint
          u.arraySet.addKnownDistinct( ctmpl.methods, mtmpl );
        }

        // Record constraint
        Modelcule.addConstraintTemplate( this.target, ctmpl );
      }
      catch (e) {
        console.error( e );
      }

      return this;
    }

    /*----------------------------------------------------------------
     */
    syncommand( name: string, args: string, fn: Function ) {
      this.endConstraint();

      var argNames = args.trim().split( /\s*,\s*/ );

      if (argNames.some( this.unknownName, this )) {
        return this;
      }

      var variables = argNames.map( u.toValueIn( this.target ) );

      if (! variables.every( u.isType( Variable ) )) {
        console.error( 'Command may only reference variables' );
        return this;
      }

      var command = new SynchronousCommand( fn, variables );

      this.target[name] = command;

      return this;
    }

    /*----------------------------------------------------------------
     * Test for invalid variable name
     */
    private
    invalidName( name: string ): boolean {
      if (! name.match( /^[a-zA-Z][\w$]*$/ )) {
        console.error( 'Invalid modelcule field name: "' + name + '"' );
        return true;
      }
      return false;
    }

    /*----------------------------------------------------------------
     * Test for invalid variable path
     */
    private
    invalidPath( path: string ): boolean {
      if (! path.match( /^[a-zA-Z][\w$]*(\.[a-zA-Z][\w$]*)*$/ )) {
        console.error( 'Invalid variable path: "' + path + '"' );
        return true;
      }
      var first = path.split( '.' )[0];
      if (! this.target.hasOwnProperty( first )) {
        console.error( 'Unknown modelcule field "' + first + '"' );
        return true;
      }
      return false;
    }

    /*----------------------------------------------------------------
     * Test if name already in modelcule
     */
    private
    nameInUse( name: string ): boolean {
      if (this.target.hasOwnProperty( name )) {
        console.error( 'Cannot redefine modelcule field "' + name + '"' );
        return true;
      }
      return false;
    }

    /*----------------------------------------------------------------
     * Test if name not in modelcule
     */
    private
    unknownName( name: string ): boolean {
      if (! this.target.hasOwnProperty( name )) {
        console.error( 'Unknown modelcule field "' + name + '"' );
        return true;
      }
      return false;
    }

  }

  (<any>ModelBuilder).prototype['v'] = ModelBuilder.prototype.variable;
  (<any>ModelBuilder).prototype['vs'] = ModelBuilder.prototype.variables;
  (<any>ModelBuilder).prototype['ov'] = ModelBuilder.prototype.outputVariable;
  (<any>ModelBuilder).prototype['ovs'] = ModelBuilder.prototype.outputVariables;
  (<any>ModelBuilder).prototype['iv'] = ModelBuilder.prototype.interfaceVariable;
  (<any>ModelBuilder).prototype['ivs'] = ModelBuilder.prototype.interfaceVariables;
  (<any>ModelBuilder).prototype['c'] = ModelBuilder.prototype.constraint;
  (<any>ModelBuilder).prototype['m'] = ModelBuilder.prototype.method;
  (<any>ModelBuilder).prototype['a'] = ModelBuilder.prototype.asyncMethod;
  (<any>ModelBuilder).prototype['eq'] = ModelBuilder.prototype.equation;


  var initialStar = /^\s*\*\s*/;
  function stripStar( name: string ) {
    return strip( name, initialStar );
  }

  var initialDollar = /^\s*\$\s*/;
  function stripDollar( name: string ) {
    return strip( name, initialDollar );
  }

  function strip( name: string, re: RegExp ) {
    if (re.test( name )) {
      return name.replace( re, '' );
    }
    else {
      return null;
    }
  }

}