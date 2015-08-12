/*####################################################################
 * Classes/interfaces related to contexts.
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  /*******************************************************************
    Context elements
   ******************************************************************/

  // Union type for all possible elements
  export
  type ContextElement = StructuralElement | DynamicElement;

  export
  type StructuralElement = Variable | Context;

  export
  type DynamicElement = Constraint | Command | Output | TouchDep;

  // Wrapper class to represent output
  export
  class Output {
    constructor( public variable: Variable ) { }
  }

  // Wrapper class to represent touch dependency
  export
  class TouchDep {
    constructor( public from: Variable | Constraint, public to: Variable | Constraint ) { }
  }

  /*******************************************************************
    Specs -- specify an element of a constraint class
   ******************************************************************/

  export
  interface VariableSpec {
    loc: string;
    init: any;
    optional: Optional;
    eq?: u.EqualityPredicate<any>;
  }

  export
  interface NestedSpec {
    loc: string;
    spec: ContextSpec;
  }

  export
  interface ReferenceSpec {
    loc: string;
    eq?: u.EqualityPredicate<any>;
  }

  export
  interface MethodSpec {
    inputs: string[];
    priorFlags: boolean[];
    outputs: string[];
    fn: Function;
  }

  export
  interface ConstraintSpec {
    loc?: string;
    variables: u.ArraySet<string>;
    methods: u.ArraySet<MethodSpec>;
    optional: Optional;
    touchVariables?: u.ArraySet<string>;
  }

  export
  interface CommandSpec {
    loc: string;
    inputs: string[];
    priorFlags: boolean[];
    outputs: string[];
    fn: Function;
    synchronous: boolean;
  }

  export
  interface OutputSpec {
    variable: string;
  }

  export
  interface TouchDepSpec {
    from: string;
    to: string;
  }

  export
  interface ContextSpec {
    variables: VariableSpec[];
    nesteds: NestedSpec[];
    references: ReferenceSpec[];
    constraints: ConstraintSpec[];
    commands: CommandSpec[];
    outputs: OutputSpec[];
    touchDeps: TouchDepSpec[];
  }

  /*******************************************************************
    Templates -- represent an element that changes as references
      change
   ******************************************************************/

  export
  type Template = ConstraintTemplate | CommandTemplate | OutputTemplate | TouchDepTemplate;

  /*==================================================================
   * Not really a stand-alone template; helper to the constraint
   *   template.
   */

  export
  class MethodTemplate {
    name: string;
    inputs: string[];
    priorFlags: boolean[];
    outputs: string[];
    fn: Function;
    instance: Method = null;

    constructor( mspec: MethodSpec ) {
      this.inputs = mspec.inputs;
      this.priorFlags = mspec.priorFlags;
      this.outputs = mspec.outputs;
      this.fn = mspec.fn;
      this.name = [mspec.inputs.join( ',' ), mspec.outputs.join( ',' )].join( '->' );
    }

    instantiate( lookup: u.Dictionary<any>, vars: u.ArraySet<Variable> ) {
      var ins = this.inputs.map( u.toValueIn( lookup ) );
      var outs = this.outputs.map( u.toValueIn( lookup ) );

      // Cannot have same variable as input and output
      for (var i = 0, l = ins.length; i < l; ++i) {
        if (ins[i] instanceof Variable &&
            ! (this.priorFlags && this.priorFlags[i]) &&
            outs.indexOf( ins[i] ) >= 0) {
          console.warn( 'Method cannot be instantiated with same variable as input and output: ' +
                        this.name );
          this.instance = null;
          return;
        }
      }

      // outs should contain only variables; no duplicates
      var outVars = u.arraySet.fromArray( <Variable[]>outs.filter( u.isType( Variable ) ) );
      if (outs.length == outVars.length) {
        this.instance = new Method( this.name,
                                    this.fn,
                                    ins,
                                    this.priorFlags,
                                    outs,
                                    u.arraySet.difference( vars, outVars )
                                  );
      }
      else {
        console.warn( 'Method cannot be instantiated with non-variable or duplicate outputs: ' +
                      this.name );
        this.instance = null;
      }
    }

    activate() {
    }
  }

  /*================================================================*/
  export
  class ConstraintTemplate {
    name: string;
    variables: u.ArraySet<string>;
    methods: u.ArraySet<MethodTemplate>;
    optional: Optional;
    instance: Constraint = null;

    constructor( spec: ConstraintSpec ) {
      this.variables = spec.variables;
      this.methods = spec.methods.map( function( mspec: MethodSpec ) {
        return new MethodTemplate( mspec );
      } );
      this.optional = spec.optional;
      this.name = spec.variables.join( ',' )
    }

    uses( path: string ) {
      return this.variables.indexOf( path ) >= 0;
    }

    instantiate( lookup: u.Dictionary<any> ) {
      var varCandidates = this.variables.map( u.toValueIn( lookup ) );
      if (varCandidates.some( function( x ) { return x === undefined; } )) {
        this.instance = null;
      }
      else {
        var vars = varCandidates.filter( u.isType( Variable ) );
        var name = this.variables.join( ',' );
        var cc = new Constraint( name, vars );
        if (this.optional !== Optional.Default) {
          cc.optional = this.optional;
        }
        for (var i = 0, l = this.methods.length; i < l; ++i) {
          var mtmpl = this.methods[i];
          mtmpl.instantiate( lookup, vars );
          if (mtmpl.instance) {
            cc.addMethod( mtmpl.instance );
          }
        }
        if (cc.methods.length) {
          this.instance = cc;
        }
        else {
          this.instance = null;
        }
      }
    }
  }

  /*================================================================*/
  export
  class CommandTemplate {
    name: string;
    inputs: string[];
    priorFlags: boolean[];
    outputs: string[];
    fn: Function;
    synchronous: boolean;
    instance: Command = null;

    ready: r.HotSwapSignal<boolean>;

    constructor( cmdspec: CommandSpec ) {
      this.inputs = cmdspec.inputs;
      this.priorFlags = cmdspec.priorFlags;
      this.outputs = cmdspec.outputs;
      this.fn = cmdspec.fn;
      this.synchronous = cmdspec.synchronous;
      this.name = [cmdspec.inputs.join( ',' ), cmdspec.outputs.join( ',' )].join( '->' );
      this.ready = new r.HotSwapSignal<boolean>();
    }

    uses( path: string ) {
      return this.inputs.indexOf( path ) >= 0 || this.outputs.indexOf( path ) >= 0;
    }

    instantiate( lookup: u.Dictionary<any> ) {
      var ins = this.inputs.map( u.toValueIn( lookup ) );
      var outs = this.outputs.map( u.toValueIn( lookup ) );

      // Ensure all paths have values
      if (ins.some( u.isUndefined ) || outs.some( u.isUndefined )) {
        this.instance = null;
        this.ready.onNext( null );
        return;
      }

      // Cannot have same variable as input and output
      for (var i = 0, l = ins.length; i < l; ++i) {
        if (ins[i] instanceof Variable &&
            ! (this.priorFlags && this.priorFlags[i]) &&
            outs.indexOf( ins[i] ) >= 0) {
          console.warn( 'Command cannot be instantiated with same variable as input and output: ' +
                        this.name );
          this.instance = null;
          this.ready.onNext( null );
          return;
        }
      }

      // outs should contain only variables; no duplicates
      var outVars = u.arraySet.fromArray( <Variable[]>outs.filter( u.isType( Variable ) ) );
      if (outs.length == outVars.length) {
        if (this.synchronous) {
          this.instance = new SynchronousCommand( this.name,
                                                  this.fn,
                                                  ins,
                                                  this.priorFlags,
                                                  outs
                                                );
          this.ready.onNext( (<SynchronousCommand>this.instance).ready );
        }
        else {
          this.instance = new Command( this.name,
                                       this.fn,
                                       ins,
                                       this.priorFlags,
                                       outs
                                     );
          this.ready.onNext( null );
        }
      }
      else {
        console.warn( 'Command cannot be instantiated with non-variable or duplicate outputs: ' +
                      this.name );
        this.instance = null;
        this.ready.onNext( null );
      }
    }

    activate() {
      if (this.instance) {
        this.instance.activate();
      }
    }

    onNext() {
      if (this.instance) {
        this.instance.onNext();
      }
    }

    onError() {
      if (this.instance) {
        this.instance.onError();
      }
    }

    onCompleted() {
      if (this.instance) {
        this.instance.onCompleted();
      }
    }
  }

  /*================================================================*/
  export
  class OutputTemplate {
    variable: string;
    instance: Output = null;

    constructor( spec: OutputSpec ) {
      this.variable = spec.variable;
    }

    uses( path: string ) {
      return this.variable == path;
    }

    instantiate( lookup: u.Dictionary<any> ) {
      var vv = lookup[this.variable];
      if (vv instanceof Variable) {
        this.instance = new Output( vv );
      }
      else {
        this.instance = null;
      }
    }
  }

  /*================================================================*/
  export
  class TouchDepTemplate {
    from: string;
    to: string;
    toTmpl: ConstraintTemplate;
    instance: TouchDep = null;

    constructor( spec: TouchDepSpec );
    constructor( from: string, to: ConstraintTemplate );
    constructor() {
      if (arguments.length == 1) {
        var spec: TouchDepSpec = arguments[0];
        this.from = spec.from;
        this.to = spec.to;
      }
      else {
        this.from = arguments[0];
        this.toTmpl = arguments[1];
      }
    }

    uses( path: string ) {
      return this.from == path ||
            (this.toTmpl ? this.toTmpl.uses( path ) : this.to == path);
    }

    instantiate( lookup: u.Dictionary<any> ) {
      var cc1 = lookup[this.from];
      if (cc1 instanceof Variable || cc1 instanceof Constraint) {
        if (this.toTmpl) {
          if (this.toTmpl.instance) {
            this.instance = new TouchDep( cc1, this.toTmpl.instance );
          }
          else {
            this.instance = null;
          }
        }
        else {
          var cc2 = lookup[this.to];
          if (cc1 !== cc2 && (cc2 instanceof Variable || cc2 instanceof Constraint)) {
            this.instance = new TouchDep( cc1, cc2 );
          }
          else {
            this.instance = null
          }
        }
      }
      else {
        this.instance = null;
      }
    }
  }


  /*******************************************************************
    The Context type
   ******************************************************************/

  /*==================================================================
   * The actual data members of a context are held in a separate
   * class.  If a dynamic element does not use any references then
   * it is simply instantiated and stored; if it does, then we store
   * a template for the element.
   */
  export
  class ContextData {

    // Variables
    variables: Variable[]                 = [];

    // Nested contexts
    nesteds: Context[]                    = [];

    // Constraints
    constraints: Constraint[]             = [];
    constraintTmpls: ConstraintTemplate[] = [];

    // Commands
    commands: Command[]                   = [];
    commandTmpls: CommandTemplate[]       = [];

    // Outputs
    outputs: Output[]                     = [];
    outputTmpls: OutputTemplate[]         = [];

    // Touch dependencies
    touchDeps: TouchDep[]                 = [];
    touchDepTmpls: TouchDepTemplate[]     = [];

    // Templates that need to be updated
    outdated: u.ArraySet<Template>        = [];

    // All paths we are watching
    paths: u.Dictionary<any>              = {};

    // Current value for each path name
    lookup: u.Dictionary<any>             = {};

    // Publishes when dynamic elements of the context have changed
    changes = new r.BasicObservable<Context>();
  }

  /*==================================================================
   * The context class itself has a hidden ContextData field; all
   *   other fields are user-defined context properties.
   * (Member functions of the context class are all static.)
   */
  export
  class Context {

    '#hd_data': ContextData;

    [key: string]: any;

    constructor( init?: u.Dictionary<any> ) {
      if (init) {
        for (var key in init) {
          if (key !== '#hd_data' && init.hasOwnProperty( key )) {
            this[key] = init[key];
          }
        }
      }
    }

    /*----------------------------------------------------------------
     * A "constructor" - add everything from context spec to the
     * given context.
     */
    static
    construct( ctx: Context,
               spec: ContextSpec,
               init?: u.Dictionary<any> ): Context {
      if (init && typeof init !== 'Object') {
        throw "Invalid initialization object passed to Context.construct: " + init;
      }

      for (var i = 0, l = spec.variables.length; i < l; ++i) {
        var vspec = spec.variables[i];
        if (! (vspec.loc in ctx)) {
          Context.addVariable( ctx, vspec, init ? init[vspec.loc] : undefined );
        }
      }

      for (var i = 0, l = spec.nesteds.length; i < l; ++i) {
        var nspec = spec.nesteds[i];
        if (! (nspec.loc in ctx)) {
          Context.addNestedContext( ctx, nspec, init ? init[nspec.loc] : undefined );
        }
      }

      for (var i = 0, l = spec.references.length; i < l; ++i) {
        var rspec = spec.references[i];
        if (! (rspec.loc in ctx)) {
          Context.addReference( ctx, rspec, init ? init[rspec.loc] : undefined );
        }
      }

      for (var i = 0, l = spec.constraints.length; i < l; ++i) {
        Context.addConstraint( ctx, spec.constraints[i] );
      }

      for (var i = 0, l = spec.commands.length; i < l; ++i) {
        Context.addCommand( ctx, spec.commands[i] );
      }

      for (var i = 0, l = spec.outputs.length; i < l; ++i) {
        Context.addOutput( ctx, spec.outputs[i] );
      }

      for (var i = 0, l = spec.touchDeps.length; i < l; ++i) {
        Context.addTouchDep( ctx, spec.touchDeps[i] );
      }

      return ctx;
    }

    /*----------------------------------------------------------------
     * Add variable
     */
    static
    addVariable( ctx: Context, spec: VariableSpec, init: any ): Variable {
      var vv = new Variable( spec.loc, init === undefined ? spec.init : init, spec.eq );
      if (spec.optional !== Optional.Default) {
        vv.optional = spec.optional;
      }
      ctx['#hd_data'].variables.push( vv );
      ctx[spec.loc] = vv;
      return vv;
    }

    /*----------------------------------------------------------------
     * Add nested context
     */
    static
    addNestedContext( ctx: Context, spec: NestedSpec, init: u.Dictionary<any> ): Context {
      var nested = new Context();
      Context.construct( nested, spec.spec );
      ctx['#hd_data'].nesteds.push( nested );
      ctx[spec.loc] = nested;
      return nested;
    }

    /*----------------------------------------------------------------
     * Add dynamic reference
     */
    static
    addReference( ctx: Context, spec: ReferenceSpec, init: any ): r.Signal<any> {
      var prop = new r.BasicSignal<any>( init, spec.eq );
      Context.defineReferenceAccessors( ctx, spec.loc, prop );
      return prop;
    }

    static
    defineReferenceAccessors( ctx: Context, loc: string, prop: r.BasicSignal<any> ) {
      Object.defineProperty( ctx, '$'+loc, {configurable: true,
                                            enumerable: false,
                                            value: prop
                                           }
                           );
      Object.defineProperty( ctx, loc, {configurable: true,
                                        enumerable: true,
                                        get: prop.get.bind( prop ),
                                        set: prop.set.bind( prop )
                                       }
                           );
    }

    /*----------------------------------------------------------------
     * Add constraint
     */
    static
    addConstraint( ctx: Context, spec: ConstraintSpec ): ConstraintTemplate {
      var hd_data = ctx['#hd_data'];
      var usesRef = false;
      for (var i = 0, l = spec.variables.length; i < l; ++i) {
        var name = spec.variables[i];
        Context.addNameToLookup( ctx, name );
        if (name in hd_data.paths) {
          usesRef = true;
        }
      }
      var tmpl = new ConstraintTemplate( spec );
      if (usesRef) {
        hd_data.constraintTmpls.push( tmpl );
        u.arraySet.addKnownDistinct( hd_data.outdated, tmpl );
      }
      else {
        tmpl.instantiate( hd_data.lookup );
        if (tmpl.instance) {
          hd_data.constraints.push( tmpl.instance );
        }
        else {
          console.warn( "Invalid instantiation of constant constraint " + tmpl.name );
        }
      }
      if (spec.loc) {
        ctx[spec.loc] = tmpl;
      }
      if (spec.touchVariables) {
        for (var i = 0, l = spec.touchVariables.length; i < l; ++i) {
          var touch = spec.touchVariables[i];
          Context.addTouchDep( ctx, touch, tmpl );
        }
      }
      return tmpl;
    }

    /*----------------------------------------------------------------
     * Add command
     */
    static
    addCommand( ctx: Context, spec: CommandSpec ): CommandTemplate {
      var hd_data = ctx['#hd_data'];
      var usesRef = false;
      [spec.inputs, spec.outputs].forEach( function( vars: string[] ) {
        for (var i = 0, l = vars.length; i < l; ++i) {
          var name = vars[i];
          Context.addNameToLookup( ctx, name );
          if (name in hd_data.paths) {
            usesRef = true;
          }
        }
      } );
      var tmpl = new CommandTemplate( spec );
      if (usesRef) {
        hd_data.commandTmpls.push( tmpl );
        u.arraySet.addKnownDistinct( hd_data.outdated, tmpl );
      }
      else {
        tmpl.instantiate( hd_data.lookup );
        if (tmpl.instance) {
          hd_data.commands.push( tmpl.instance );
        }
        else {
          console.warn( "Invalid instantiation of constant command " + tmpl.name );
        }
      }
      if (spec.loc) {
        ctx[spec.loc] = tmpl;
      }
      return tmpl;
    }

    /*----------------------------------------------------------------
     * Add output
     */
    static
    addOutput( ctx: Context, spec: OutputSpec ): OutputTemplate {
      var hd_data = ctx['#hd_data'];
      Context.addNameToLookup( ctx, spec.variable );
      var tmpl = new OutputTemplate( spec );
      if (spec.variable in hd_data.paths) {
        hd_data.outputTmpls.push( tmpl );
        u.arraySet.addKnownDistinct( hd_data.outdated, tmpl );
      }
      else {
        tmpl.instantiate( hd_data.lookup );
        if (tmpl.instance) {
          hd_data.outputs.push( tmpl.instance );
        }
        else {
          console.warn( "Invalid instantiation constant output " + spec.variable );
        }
      }
      return tmpl;
    }

    /*----------------------------------------------------------------
     * Add touch dependency
     */
    static
    addTouchDep( ctx: Context, spec: TouchDepSpec ): TouchDepTemplate;
    static
    addTouchDep( ctx: Context, from: string, to: ConstraintTemplate ): TouchDepTemplate;
    static
    addTouchDep( ctx: Context ): TouchDepTemplate {
      var hd_data = ctx['#hd_data'];
      var from: string;
      var to: string;
      var toTmpl: ConstraintTemplate;
      var tmpl: TouchDepTemplate;
      if (arguments.length == 2) {
        var spec: TouchDepTemplate = arguments[1];
        from = spec.from;
        to = spec.to;
        tmpl = new TouchDepTemplate( spec );
      }
      else {
        from = arguments[1];
        toTmpl = arguments[2];
        tmpl = new TouchDepTemplate( from, toTmpl );
      }

      Context.addNameToLookup( ctx, from );
      if (to) {
        Context.addNameToLookup( ctx, to );
      }
      if (from in hd_data.paths || to in hd_data.paths || toTmpl) {
        hd_data.touchDepTmpls.push( tmpl );
        u.arraySet.addKnownDistinct( hd_data.outdated, tmpl );
      }
      else {
        tmpl.instantiate( hd_data.lookup );
        if (tmpl.instance) {
          hd_data.touchDeps.push( tmpl.instance );
        }
        else {
          console.warn( "Invalid instantiation of constant touch dependency: " + from +
                        " => " + to );
        }
      }
      return tmpl;
    }

    /*----------------------------------------------------------------
     * Are there changes to dynamic elements that need to be
     *   processed?
     */
    static
    hasUpdates( ctx: Context ) {
      return ctx['#hd_data'].outdated.length > 0;
    }

    /*----------------------------------------------------------------
     * Update all templates which need it.
     */
    static
    performUpdates( ctx: Context ) {
      var hd_data = ctx['#hd_data'];
      for (var i = 0, l = hd_data.outdated.length; i < l; ++i) {
        hd_data.outdated[i].instantiate( hd_data.lookup );
      }
      hd_data.outdated = [];
    }

    /*----------------------------------------------------------------
     * Update all templates which need it, but also record the changes
     *   which were made.
     */
    static
    reportUpdates( ctx: Context ): {removes: DynamicElement[]; adds: DynamicElement[]} {
      var result = {removes: <DynamicElement[]>[], adds: <DynamicElement[]>[]};
      var hd_data = ctx['#hd_data'];
      for (var i = 0, l = hd_data.outdated.length; i < l; ++i) {
        var tmpl = hd_data.outdated[i];
        if (tmpl.instance) {
          result.removes.unshift( tmpl.instance );
        }
        tmpl.instantiate( hd_data.lookup );
        if (tmpl.instance) {
          result.adds.push( tmpl.instance );
        }
      }
      hd_data.outdated = [];
      return result;
    }

    /*----------------------------------------------------------------
     * Getter
     */
    static
    changes( ctx: Context ): r.ProxyObservable<Context> {
      return ctx['#hd_data'].changes;
    }

    /*----------------------------------------------------------------
     * Getter
     */
    static
    nesteds( ctx: Context ): Context[] {
      return ctx['#hd_data'].nesteds;
    }

    /*----------------------------------------------------------------
     * Getter
     */
    static
    variables( ctx: Context ): Variable[] {
      var hd_data = ctx['#hd_data'];
      return hd_data.variables;
    }

    /*----------------------------------------------------------------
     * Getter
     */
    static
    constraints( ctx: Context ): Constraint[] {
      var hd_data = ctx['#hd_data'];
      return hd_data.constraints.concat(
        hd_data.constraintTmpls.map( getInstance ).filter( u.isNotNull )
      );
    }

    /*----------------------------------------------------------------
     * Getter
     */
    static
    commands( ctx: Context ): Command[] {
      var hd_data = ctx['#hd_data'];
      return hd_data.commands.concat(
        hd_data.commandTmpls.map( getInstance ).filter( u.isNotNull )
      );
    }

    /*----------------------------------------------------------------
     * Getter
     */
    static
    outputs( ctx: Context ): Output[] {
      var hd_data = ctx['#hd_data'];
      return hd_data.outputs.concat(
        hd_data.outputTmpls.map( getInstance ).filter( u.isNotNull )
      );
    }

    /*----------------------------------------------------------------
     * Getter
     */
    static
    touchDeps( ctx: Context ): TouchDep[] {
      var hd_data = ctx['#hd_data'];
      return hd_data.touchDeps.concat(
        hd_data.touchDepTmpls.map( getInstance ).filter( u.isNotNull )
      );
    }

    /*----------------------------------------------------------------
     * Add value of name to lookup; if name uses references, then
     * subscribe to path so that it will be updated
     */
    private static
    addNameToLookup( ctx: Context, name: string ) {
      var hd_data = ctx['#hd_data'];
      if (! (name in hd_data.lookup)) {
        var path = new Path( ctx, name );
        hd_data.lookup[name] = path.get( null );
        if (! path.constant) {
          path.addObserver( Context, Context.onNextPath, null, null, {ctx: ctx, name: name} );
          hd_data.paths[name] = path;
        }
      }
    }

    /*----------------------------------------------------------------
     * When a path that some element of this context depends on
     * changes.
     */
    private static
    onNextPath( value: any, params: {ctx: Context; name: string} ) {
      var ctx = params.ctx;
      var name = params.name;
      var hd_data = ctx['#hd_data'];
      hd_data.lookup[name] = value;
      var checkForUse = function( tmpl: Template ) {
        if (tmpl.uses( name )) {
          u.arraySet.add( hd_data.outdated, tmpl );
        }
      };
      hd_data.constraintTmpls.forEach( checkForUse );
      hd_data.outputTmpls.forEach( checkForUse );
      hd_data.touchDepTmpls.forEach( checkForUse );
      hd_data.changes.sendNext( ctx );
    }
  }

  /*------------------------------------------------------------------
   * Rather than require every context subclass to call the context
   * constructor, we define a getter that creates it the first time it
   * is accessed.
   */
  Object.defineProperty( Context.prototype, '#hd_data', {
    get: function makeData() {
      var data = new ContextData();
      Object.defineProperty( this, '#hd_data', {configurable: true,
                                                enumerable: false,
                                                value: data
                                               }
                           );
      return data;
    }
  } );

  /*==================================================================
   * Helper functions
   */
  function getInstance<T>( tmpl: {instance: T} ): T {
    return tmpl.instance;
  }

}
