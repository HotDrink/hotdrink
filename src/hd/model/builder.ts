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

    // Used to generate unique ids
    ids: IdGenerator;

    // If the last thing created was a constraint or a method in a
    // constraint, this will point to the constraint; otherwise it
    // will be null
    last: Constraint = null;

    /*----------------------------------------------------------------
     * Can either take an existing modelcule and expand on it, or create a
     * brand new modelcule.
     */
    constructor( namespace: string, modelcule?: Modelcule );
    constructor( modelcule?: Modelcule );
    constructor() {
      var namespace: string;
      var modelcule: Modelcule;
      if (arguments.length > 0) {
        if (typeof arguments[0] === 'string') {
          namespace= arguments[0];
          if (arguments.length > 1) {
            modelcule = arguments[1];
          }
        }
        else {
          modelcule = arguments[0];
        }
      }
      if (modelcule) {
        this.target = modelcule;
      }
      else {
        this.target = new Modelcule();
      }
      this.ids = new IdGenerator( namespace );
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

      var stripResult = strip( name, ['$'] );
      if (! stripResult) { return null; }
      var indirect = stripResult['$'];
      name = stripResult['name'];

      if (this.invalidName( name ) || this.nameInUse( name )) { return this; }

      if (eq && typeof eq !== 'function') {
        console.error( 'Variable equality predicate must be a function' );
        return this;
      }

      // Create the variable if necessary
      var vv: Variable;
      if (init instanceof Variable) {
        vv = <any>init;
        init = undefined;
      }
      else {
        vv = new Variable( this.ids.makeId( name ), name, init, eq );
      }

      if (output) {
        vv.setOutput( true );
      }
      else {
        vv.setOutput( false );
      }

      // Record variable
      Modelcule.addVariable( this.target, vv, name, indirect );

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
     */
    private
    parseSignature( optype: string, signature: string ) {
      var inputNames: string[], outputNames: string[];
      var leftRight = signature.trim().split( /\s*->\s*/ );
      if (leftRight.length != 2) {
        console.error( 'Invalid ' + optype + ' signature: "' + signature + '"' );
        return null;
      }
      inputNames = leftRight[0] == '' ? [] : leftRight[0].split( /\s*,\s*/ );
      outputNames = leftRight[1] == '' ? [] : leftRight[1].split( /\s*,\s*/ );

      var masks: boolean[] = [];
      var priors: boolean[] = [];
      for (var i = 0, l = inputNames.length; i < l; ++i) {
        var stripResult = strip( inputNames[i], ['*', '!'] );
        if (! stripResult) { return null; }
        inputNames[i] = stripResult['name'];
        masks[i] = stripResult['*'];
        priors[i] = stripResult['!'];
      }

      if (inputNames.some( this.unknownName, this ) ||
          outputNames.some( this.unknownName, this )  ) {
        return null;
      }

      var inputs = inputNames.map( u.toValueIn( this.target ) );
      var outputs = outputNames.map( u.toValueIn( this.target ) );

      if (outputs.some( u.isNotType( Variable ) )) {
        // Not an error, but not a selectable method
        console.warn( 'Igorning ' + optype + ' with non-variable output(s): ' + signature );
        return null;
      }

      var isUnique = function( el: any, i: number, a: any[] ) {
        return i == a.indexOf( el );
      }
      if (! outputs.every( isUnique )) {
        console.error( 'Duplicate outputs in ' + optype + ' ' + signature );
        return null;
      }

      return {inputs: inputs,
              outputs: outputs,
              priors: priors.length == 0 ? null : priors,
              masks: masks.length == 0 ? null : masks
             };
    }

    /*----------------------------------------------------------------
     * Add a method to the current modelcule.
     */
    asyncMethod( signature: string, fn: Function ): ModelBuilder {
      return this.method( signature, fn, true );
    }

    method( signature: string, fn: Function, async = false ): ModelBuilder {
      if (! this.last) {
        console.error( 'Builder function "method" called with no constraint' );
        return this;
      }

      var op = this.parseSignature( 'method', signature );

      var constraintVars = this.last.variables;
      var isNotConstraintVar = function( vv: Variable ) {
        return constraintVars.indexOf( vv ) < 0;
      };

      if (op.inputs.some( isNotConstraintVar )) {
        console.error( "Input does not belong to constraint in method " + signature );
        return this;
      }
      if (op.outputs.some( isNotConstraintVar )) {
        console.error( "Output does not belong to constraint in method " + signature );
        return this;
      }

      // Create method
      var mm = new Method( this.ids.makeId( signature ),
                           signature,
                           async ? fn : r.liftFunction( fn, op.outputs.length, op.masks ),
                           op.inputs,
                           op.outputs,
                           op.priors,
                           u.arraySet.difference( constraintVars, op.outputs ),
                           op.outputs
                         );
      this.last.addMethod( mm );

      return this;
    }

    /*----------------------------------------------------------------
     * Add a constraint to the property modelcule.
     */
    constraint( name: string, signature: string ): ModelBuilder;
    constraint( signature: string ): ModelBuilder;
    constraint(): ModelBuilder {
      this.endConstraint();

      var name: string, signature: string;
      if (arguments.length > 1) {
        name = arguments[0];
        signature = arguments[1];
      }
      else {
        signature = arguments[0];
      }

      var varNames = signature.trim().split( /\s*,\s*/ );

      if (varNames.some( this.unknownName, this )) {
        return this;
      }

      var variables = varNames.map( u.toValueIn( this.target ) );

      if (! variables.every( u.isType( Variable ) )) {
        console.error( 'Constraint may only contain variables' );
        return this;
      }

      // Create constraint
      var cc = new Constraint( this.ids.makeId( signature ), signature, variables );

      // Record constraint
      this.last = cc;

      if (name) {
        if (! this.invalidName( name ) && ! this.nameInUse( name )) {
          Modelcule.defineProperty( this.target, name, this.last, false );
        }
      }

      return this;
    }

    endConstraint(): ModelBuilder {
      if (this.last) {
        Modelcule.addConstraint( this.target, this.last );
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
      }
      catch (err) {
        console.error( err );
        return this;
      }

      // Check variables
      var varNames = eqString.match( /[a-zA-Z_$][\w$]*/g );

      if (varNames.some( this.unknownName, this )) {
        console.error( 'Unknown variables in equation: "' + eqString + '"' );
        return this;
      }

      for (var i = 0, l = varNames.length; i < l; ++i) {
        if (varNames.indexOf( varNames[i], i + 1 ) > -1) {
          console.error( 'Duplicate variables in equation: "' + eqString + '"' );
          return this;
        }
      }

      var variables = varNames.map( u.toValueIn( this.target ) );
      var inputs = variables.slice( 0 );
      var inputVars = inputs.filter( u.isType( Variable ) );

      // Create constraint
      var allNames = varNames.join( ', ' );
      var cc = new Constraint( this.ids.makeId( allNames ), allNames, variables );

      try {

        var notOutput = function( vv: Variable ) {
          return vv !== output;
        };

        for (var i = 0, l = varNames.length; i < l; ++i) {
          // Partition input/output names
          var outputName = varNames[i];
          var output = this.target[outputName];

          if (output instanceof Variable) {
            // Make signature
            var signature = allNames + ' -> ' + outputName;

            // Build method function
            var fnBody = eqn.fnBody( varNames, outputName, equation );
            var args = (<string[]>[null]).concat( varNames );
            args.push( fnBody );
            var fn = new (Function.bind.apply( Function, args ))();

            // Create method
            var mm = new Method( this.ids.makeId( signature ),
                                 signature,
                                 r.liftFunction( fn ),
                                 inputs,
                                 [output],
                                 [],
                                 inputVars.filter( notOutput ),
                                 [output]
                               );

            // Record method
            cc.addMethod( mm );
          }
        }

        // Record constraint
        Modelcule.addConstraint( this.target, cc );
      }
      catch (e) {
        console.error( 'Unable to create equation', e );
      }

      return this;
    }

    /*----------------------------------------------------------------
     */
    command( name: string, signature: string, fn: Function, async = false ) {
      this.endConstraint();

      var op = this.parseSignature( 'command', signature );

      var command =
            new Command( this.ids.makeId( signature ),
                         signature,
                         async ? fn : r.liftFunction( fn, op.outputs.length, op.masks ),
                         op.inputs,
                         op.outputs,
                         op.priors
                       );

      this.target[name] = command;

      return this;
    }

    /*----------------------------------------------------------------
     */
    syncommand( name: string, signature: string, fn: Function, async = false ) {
      this.endConstraint();

      var op = this.parseSignature( 'syncommand', signature );

      var command =
            new SynchronousCommand( this.ids.makeId( signature ),
                                    signature,
                                    async ? fn : r.liftFunction( fn, op.outputs.length, op.masks ),
                                    op.inputs,
                                    op.outputs,
                                    op.priors
                                  );

      this.target[name] = command;

      return this;
    }

    /*----------------------------------------------------------------
     * Test for invalid variable name
     */
    private
    invalidName( name: string ): boolean {
      if (! name.match( /^[a-zA-Z$][\w\d$]*$/ )) {
        console.error( 'Invalid modelcule field name: "' + name + '"' );
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