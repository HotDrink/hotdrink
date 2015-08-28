/*####################################################################
 * Classes/interfaces related to contexts.
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  /*******************************************************************
     Helpers
   ******************************************************************/

  // getter for constant
  function pathConstant( p: Path ) {
    return p.constant;
  }

  // object that can retrieve a path for a string
  interface PathLookup {
    get( name: string ): Path;
  }

  // ojbect that has an id
  interface HasId {
    id: string;
  }

  // lexicographical comparison for arrays of HasId
  function compareIds( a: HasId[], b: HasId[] ) {
    for (var i = 0, l = a.length, m = b.length; i < l && i < m; ++i) {
      if (a[i] !== b[i]) {
        var cmp = a[i].id.localeCompare( b[i].id );
        if (cmp != 0) {
          return cmp;
        }
      }
    }

    return l - m;
  }

  // lexicographical comparison for array
  function compareAnys( a: any[], b: any[] ) {
    for (var i = 0, l = a.length, m = b.length; i < l && i < m; ++i) {
      if (a[i] !== b[i]) {
        var ai = a[i];
        var bi = b[i];
        var cmp: number;
        if ((ai instanceof Variable || ai instanceof Constraint || ai instanceof Command) &&
            (bi instanceof Variable || bi instanceof Constraint || bi instanceof Command)   ) {
          cmp = ai.id.localeCompare( bi.id );
        }
        else if (typeof ai === 'number' && typeof bi === 'number') {
          cmp = ai - bi;
        }
        else if (typeof ai === 'string' && typeof bi === 'string') {
          cmp = ai.localeCompare( bi );
        }
        else {
          cmp = (ai + "").localeCompare( bi + "" );
        }
        if (cmp != 0) {
          return cmp;
        }
      }
    }

    return l - m;
  }

  // find the differences between two SORTED arrays
  function listDiff<T>( a: T[], b: T[], compare: (a: T, b: T) => number ) {
    var leftOnly    = <T[]> [];
    var leftShared  = <T[]> [];
    var rightOnly   = <T[]> [];
    var rightShared = <T[]> []

    var i = 0;
    var j = 0;
    var l = a.length;
    var  m = b.length;
    while (i < l && j < m) {
      var cmp = compare( a[i], b[j] );
      if (cmp < 0) {
        leftOnly.push( a[i] );
        ++i;
      }
      else if (cmp > 0) {
        rightOnly.push( b[j] );
        ++j;
      }
      else {
        leftShared.push( a[i] );
        rightShared.push( b[j] );
        ++i; ++j;
      }
    }

    while (i < l) {
      leftOnly.push( a[i] );
      ++i;
    }

    while (j < m) {
      rightOnly.push( b[j] );
      ++j;
    }

    return {leftOnly: leftOnly, leftShared: leftShared,
            rightOnly: rightOnly, rightShared: rightShared};
  }


  /*******************************************************************
    Context elements
   ******************************************************************/

  // Union type for all possible elements
  export
  type ContextElement = Variable | Context | Constraint | Command | TouchDep | Output;

  // Wrapper class to represent touch dependency
  export
  class TouchDep {
    constructor( public from: Variable | Constraint, public to: Variable | Constraint ) { }
  }

  // Wrapper class to represent output
  export
  class Output {
    constructor( public variable: Variable ) { }
  }

  export
  interface ContextClass {
    new (): Context;
  }

  // Changes made by a context in response to an update
  export
  interface ContextChanges {
    removes: ContextElement[];
    adds: ContextElement[]
  }

  /*******************************************************************
    Specs -- specify an element of a constraint class
   ******************************************************************/

  export
  interface ConstantSpec {
    loc: string;
    value: any;
  }

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
    klass?: ContextClass;
    spec?: ContextSpec;
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
  interface TouchDepSpec {
    from: string;
    to: string;
  }

  export
  interface OutputSpec {
    variable: string;
  }

  export
  interface ContextSpec {
    constants: ConstantSpec[];
    variables: VariableSpec[];
    nesteds: NestedSpec[];
    references: ReferenceSpec[];
    constraints: ConstraintSpec[];
    commands: CommandSpec[];
    touchDeps: TouchDepSpec[];
    outputs: OutputSpec[];
  }

  /*******************************************************************
    Templates -- represent an element that changes as paths change.

    Instances -- represent a single filling of blanks in a template.
   ******************************************************************/

  // Union type for instances
  type TemplateInstance = ConstraintInstance | CommandInstance | TouchDepInstance | OutputInstance;

  // getter for element associated with instance
  function getElement( inst: TemplateInstance ) {
    return inst.element;
  }

  /*==================================================================
   * Abstract base class for all templates.
   * For generality, this class does not interact directly with paths.
   * That means its the derived class' responsibility to:
   * - in constructor, subscribe to any paths used by the template
   * - in constructor, pick a path and assign to master
   * - in destructor, unsubscribe to all paths
   */
  class Template extends r.BasicObservable<Template> {

    // All paths used by this template
    paths: u.ArraySet<Path> = [];

    // Any path with same cardinality as the template
    master: Path;

    // All instances created from this template, in sorted order
    instances : TemplateInstance[] = [];

    // Have their been any changes since the last update?
    changed = true;

    /*----------------------------------------------------------------
     */
    addPath( path: Path ) {
      if (u.arraySet.add( this.paths, path )) {
        path.addObserver( this );
        if (! this.master || this.master.cardinality < path.cardinality) {
          this.master = path;
        }
      }
    }

    addPaths( paths: Path[] ) {
      paths.forEach( this.addPath, this );
    }

    /*----------------------------------------------------------------
     */
    isConstant(): boolean {
      return this.paths.every( pathConstant );
    }

    /*----------------------------------------------------------------
     * To be implemented by derived classes
     */

    // Abstract:  Create an instance for a given position
    define( pos: Position ): TemplateInstance {
      throw "Attempt to call abstract method";
    }

    // Abstract:  Order two instances
    compare( a: TemplateInstance, b: TemplateInstance ): number {
      throw "Attempt to call abstract method";
    }

    // Abstract:  Create element for instance
    create( inst: TemplateInstance ) {
      throw "Attempt to call abstract method";
    }

    /*----------------------------------------------------------------
     * Overload addObserver so that subscribing to a template needing
     * updates results in automatic notification.
     */
    addObserver( observer: r.Observer<Template> ): r.Observer<Template>;
    addObserver( object: Object,
                 onNext: (value: Template) => void,
                 onError: (error: any) => void,
                 onCompleted: () => void        ): r.Observer<Template>;
    addObserver<U>( object: Object,
                    onNext: (value: Template, id?: U) => void,
                    onError: (error: any, id?: U) => void,
                    onCompleted: (id?: U) => void,
                    id: U                                  ): r.Observer<Template>;
    addObserver( object: Object,
                 onNext?: (value: Template, id?: any) => void,
                 onError?: (error: any, id?: any) => void,
                 onCompleted?: (id?: any) => void,
                 id?: any                                  ): r.Observer<Template> {
      var added: r.Observer<Template>;
      if (arguments.length == 1) {
        added = super.addObserver( <r.Observer<Template>>object );
      }
      else {
        added = super.addObserver( object, onNext, onError, onCompleted, id );
      }
      if (added && this.changed) {
        added.onNext( this );
      }
      return added;
    }

    /*----------------------------------------------------------------
     * Recalculate all instances and report any changes.
     */
    update( changes: ContextChanges ) {
      var newInstances = <TemplateInstance[]> [];

      if (this.master) {
        // Take all positions from master and try to create instance
        this.master.forEach( function( vv: any, pos: Position ) {
          var inst = this.define( pos );
          if (inst) {
            newInstances.push( inst );
          }
        }, this );
      }
      else {
        var inst = this.define( null );
        if (inst) {
          newInstances.push( inst );
        }
      }

      // Sort the list
      newInstances.sort( this.compare );

      // Calculate difference between this list and our new list
      var diff = listDiff( this.instances, newInstances, this.compare );

      // Put leftOnly on the remove list
      if (diff.leftOnly.length > 0) {
        changes.removes.push.apply( changes.removes, diff.leftOnly.map( getElement ) );
      }

      // Copy over elements for shared
      for (var i = 0, l = diff.leftShared.length; i < l; ++i) {
        diff.rightShared[i].element = diff.leftShared[i].element;
      }

      // Create elements for rightOnly and put on the add list
      if (diff.rightOnly.length > 0) {
        diff.rightOnly.forEach( function( inst: TemplateInstance ) {
          this.create( inst );
          changes.adds.push( inst.element );
        }, this );
      }

      // Record results
      this.instances = newInstances;
      this.changed = false;
    }

    /*----------------------------------------------------------------
     * All current elements created by this template
     */
    getElements(): ContextElement[] {
      return this.instances.map( getElement );
    }

    /*----------------------------------------------------------------
     * When a path used by this template changes.  Currently, we
     * ignore the position that changes and just always recalculate
     * all positions.
     */
    onNext() {
      if (! this.changed) {
        this.changed = true;
        this.sendNext( this );
      }
    }

    onError() { }

    onCompleted() { }

    /*----------------------------------------------------------------
     */
    destruct() {
      for (var i = 0, l = this.paths.length; i < l; ++i) {
        this.paths[i].removeObserver( this );
      }
    }
  }

  /*==================================================================
   * MethodTemplate slightly different from other templates.
   * It's not actually a template in its own right (doesn't inherit
   * from Template class); it's more a helper for ConstraintTemplate
   */
  interface MethodInstance {
    inputs: any[];
    outputs: Variable[];
  }

  class MethodTemplate {
    name: string;
    inputs: Path[];
    priorFlags: boolean[];
    outputs: Path[];
    fn: Function;

    /*----------------------------------------------------------------
     * Look up paths, but don't subscribe; the constraint template
     * handles that
     */
    constructor( mspec: MethodSpec, lookup: PathLookup ) {
      this.inputs = mspec.inputs.map( lookup.get, lookup );
      if (mspec.priorFlags) {
        this.priorFlags = mspec.priorFlags.slice( 0 );
      }
      this.outputs = mspec.outputs.map( lookup.get, lookup );
      this.fn = mspec.fn;
      this.name = [mspec.inputs.join( ',' ), mspec.outputs.join( ',' )].join( '->' );
    }

    /*----------------------------------------------------------------
     * Create an instance for a given position
     */
    define( pos: Position ): MethodInstance {
      var get = function( p: Path ) { return p.get( pos ) };
      var ins = this.inputs.map( get );
      var outs = this.outputs.map( get );

      // Cannot have same variable as input and output
      for (var i = 0, l = ins.length; i < l; ++i) {
        if (ins[i] instanceof Variable &&
            ! (this.priorFlags && this.priorFlags[i]) &&
            outs.indexOf( ins[i] ) >= 0) {
          console.warn( 'Method cannot be instantiated with same variable as input and output: ' +
                        this.name );
          return null;
        }
      }

      // outs should contain only variables; no duplicates
      var outVars = u.arraySet.fromArray( <Variable[]>outs.filter( u.isType( Variable ) ) );
      if (outs.length != outVars.length) {
        console.warn( 'Method cannot be instantiated with non-variable or duplicate outputs: ' +
                      this.name );
        return null;
      }


      return {inputs: ins, outputs: outs};
    }

    /*----------------------------------------------------------------
     * Create element for instance; requires list of other variables
     * in the constraint.
     */
    create( inst: MethodInstance, vars: u.ArraySet<Variable> ): Method {
      return new Method( this.name,
                         this.fn,
                         inst.inputs,
                         this.priorFlags,
                         inst.outputs,
                         u.arraySet.difference( vars, inst.outputs )
                       );
    }
  }

  /*==================================================================
   * Constraint Template.
   */
  class ConstraintInstance {
    element: Constraint;

    constructor( public all: any[],
                 public variables: Variable[],
                 public methods: MethodInstance[],
                 public touchVariables: Variable[] ) { }
  }

  class ConstraintTemplate extends Template {
    name: string;
    variables: Path[];
    methods: MethodTemplate[];
    optional: Optional;
    touchVariables: Path[];

    /*----------------------------------------------------------------
     * Initialize, look up paths, subscribe
     */
    constructor( spec: ConstraintSpec, lookup: PathLookup ) {
      super();
      this.addPaths( this.variables = spec.variables.map( lookup.get, lookup ) );
      this.methods = spec.methods.map( function( mspec: MethodSpec ) {
        return new MethodTemplate( mspec, lookup );
      } );
      this.optional = spec.optional;
      if (spec.touchVariables && spec.touchVariables.length) {
        this.addPaths( this.touchVariables = spec.touchVariables.map( lookup.get, lookup ) );
      }
      this.name = spec.variables.join( ',' )
    }

    /*----------------------------------------------------------------
     * Create an instance for a given position.
     */
    define( pos: Position ) {
      var all = <any[]> [];
      var vvs = <Variable[]> [];

      for (var i = 0, l = this.variables.length; i < l; ++i) {
        var vv = this.variables[i].get( pos );
        if (vv === undefined) {
          return null;
        }
        all.push( vv );
        if (vv instanceof Variable) {
          vvs.push( vv );
        }
      }

      var minsts = <MethodInstance[]> [];
      var hasMethods = false;

      for (var i = 0, l = this.methods.length; i < l; ++i) {
        var minst = this.methods[i].define( pos );
        if (minst) {
          minsts[i] = minst;
          hasMethods = true;
        }
      }

      if (hasMethods) {
        var tvs : u.ArraySet<Variable>;
        if (this.touchVariables && this.touchVariables.length) {
          tvs = [];
          for (var i = 0, l = this.touchVariables.length; i < l; ++i) {
            var vv = this.touchVariables[i].get( pos );
            if (vv instanceof Variable) {
              u.arraySet.add( tvs, vv );
            }
          }
        }

        return new ConstraintInstance( all, vvs, minsts, <Variable[]>tvs );
      }
      else {
        return null;
      }
    }

    /*----------------------------------------------------------------
     * Order two instances
     */
    compare( a: ConstraintInstance, b: ConstraintInstance ) {
      var cmp = compareAnys( a.all, b.all );
      if (cmp == 0 && a.touchVariables) {
        cmp = compareAnys( a.touchVariables, b.touchVariables );
      }
      return cmp;
    }

    /*----------------------------------------------------------------
     * Create element for instance
     */
    create( inst: ConstraintInstance ) {
      var cc = new Constraint( this.name, inst.variables, inst.touchVariables );
      cc.optional = this.optional;
      for (var i = 0, l = inst.methods.length; i < l; ++i) {
        if (inst.methods[i]) {
          cc.addMethod(
            this.methods[i].create( inst.methods[i], inst.variables )
          );
        }
      }
      inst.element = cc;
    }
  }

  /*==================================================================
   * Command Template.
   */
  class CommandInstance {
    element: Command;

    constructor( public inputs: any[],
                 public outputs: Variable[] ) { }
  }

  class CommandTemplate extends Template {
    name: string;
    inputs: Path[];
    priorFlags: boolean[];
    outputs: Path[];
    fn: Function;
    synchronous: boolean;

    /*----------------------------------------------------------------
     * Initialize, look up paths, subscribe
     */
    constructor( cmdspec: CommandSpec, lookup: PathLookup ) {
      super();
      this.addPaths( this.inputs = cmdspec.inputs.map( lookup.get, lookup ) )
      if (cmdspec.priorFlags) {
        this.priorFlags = cmdspec.priorFlags.slice( 0 );
      }
      this.addPaths( this.outputs = cmdspec.outputs.map( lookup.get, lookup ) )
      this.fn = cmdspec.fn;
      this.synchronous = cmdspec.synchronous;
      this.name = [cmdspec.inputs.join( ',' ), cmdspec.outputs.join( ',' )].join( '->' );
      this.activate = this.activate.bind( this );
    }

    /*----------------------------------------------------------------
     * Create an instance for a given position.
     */
    define( pos: Position ) {
      var get = function( p: Path ) { return p.get( pos ) };
      var ins = this.inputs.map( get );
      var outs = this.outputs.map( get );

      // Ensure all paths have values
      if (ins.some( u.isUndefined ) || outs.some( u.isUndefined )) {
        return null;
      }

      // Cannot have same variable as input and output
      for (var i = 0, l = ins.length; i < l; ++i) {
        if (ins[i] instanceof Variable &&
            ! (this.priorFlags && this.priorFlags[i]) &&
            outs.indexOf( ins[i] ) >= 0) {
          console.warn( 'Command cannot be instantiated with same variable as input and output: ' +
                        this.name );
          return null;
        }
      }

      // outs should contain only variables; no duplicates
      var outVars = u.arraySet.fromArray( <Variable[]>outs.filter( u.isType( Variable ) ) );
      if (outVars.length != outs.length) {
        console.warn( 'Command cannot be instantiated with non-variable or duplicate outputs: ' +
                      this.name );
        return null;
      }

      return new CommandInstance( ins, outs );
    }

    /*----------------------------------------------------------------
     * Order two instances
     */
    compare( a: CommandInstance, b: CommandInstance ) {
      var cmp = compareAnys( a.inputs, b.inputs );
      if (cmp == 0) {
        cmp = compareIds( a.outputs, b.outputs );
      }
      return cmp;
    }

    /*----------------------------------------------------------------
     * Create element for instance
     */
    create( inst: CommandInstance ) {
      if (this.synchronous) {
        inst.element = new SynchronousCommand( this.name,
                                               this.fn,
                                               inst.inputs,
                                               this.priorFlags,
                                               inst.outputs     );
      }
      else {
        inst.element = new Command( this.name,
                                    this.fn,
                                    inst.inputs,
                                    this.priorFlags,
                                    inst.outputs     );
      }
    }

    /*----------------------------------------------------------------
     */
    activate() {
      var cmds = this.getElements();
      if (cmds.length) {
        (<Command>cmds[0]).activate();
      }
    }
  }

  /*==================================================================
   * TouchDep Template.
   */
  class TouchDepInstance {
    element: TouchDep;

    constructor( public from: Constraint|Variable,
                 public to: Constraint|Variable    ) { }
  }

  class TouchDepTemplate extends Template {
    name: string;
    from: Path;
    to: Path;

    /*----------------------------------------------------------------
     * Initialize, look up paths, subscribe
     */
    constructor( spec: TouchDepSpec, lookup: PathLookup ) {
      super();
      this.addPath( this.from = lookup.get( spec.from ) );
      this.addPath( this.to = lookup.get( spec.to ) );
      this.name = this.from + '=>' + this.to;
    }

    /*----------------------------------------------------------------
     * Create an instance for a given position.
     */
    define( pos: Position ) {
      var cc1 = this.from.get( pos );
      var cc2 = this.to.get( pos );
      if (cc1 !== cc2 &&
          (cc1 instanceof Variable || cc1 instanceof Constraint) &&
          (cc2 instanceof Variable || cc2 instanceof Constraint)   ) {
        return new TouchDepInstance( cc1, cc2 );
      }
      else {
        return null;
      }
    }

    /*----------------------------------------------------------------
     * Order two instances
     */
    compare( a: TouchDepInstance, b: TouchDepInstance ) {
      var cmp = a.from.id.localeCompare( b.from.id );
      if (cmp == 0) {
        cmp = a.to.id.localeCompare( b.to.id );
      }
      return cmp;
    }

    /*----------------------------------------------------------------
     * Create element for instance
     */
    create( inst: TouchDepInstance ) {
      inst.element = new TouchDep( inst.from, inst.to );
    }
  }

  /*==================================================================
   * Output Template;
   */
  class OutputInstance {
    element: Output;

    constructor( public variable: Variable ) { }
  }

  class OutputTemplate extends Template {
    name: string;
    variable: Path;

    /*----------------------------------------------------------------
     * Initialize, look up paths, subscribe
     */
    constructor( spec: OutputSpec, lookup: PathLookup ) {
      super();
      this.addPath( this.variable = lookup.get( spec.variable ) );
      this.name = '@' + spec.variable;
    }

    /*----------------------------------------------------------------
     * Create an instance for a given position.
     */
    define( pos: Position ) {
      var vv = this.variable.get( pos );
      if (vv instanceof Variable) {
        return new OutputInstance( vv );
      }
    }

    /*----------------------------------------------------------------
     * Order two instances
     */
    compare( a: OutputInstance, b: OutputInstance ) {
      return a.variable.id.localeCompare( b.variable.id );
    }

    /*----------------------------------------------------------------
     * Create element for instance
     */
    create( inst: OutputInstance ) {
      inst.element = new Output( inst.variable );
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
  class ContextData extends r.BasicObservable<Context> {

    // The context object this belongs to
    context: Context;

    // The static elements
    elements: u.ArraySet<ContextElement> = [];

    // Templates for dynamic elements
    templates: Template[] = [];

    // Any static elements added since the last update
    added: ContextElement[] = [];

    // Any static elements removed since the last update
    removed: ContextElement[] = [];

    // Templates whose paths have changed since last update
    outdated: Template[] = [];

    // Have any changes been made since last update?
    changed = false;

    // All paths used by this context (to promote sharing among templates)
    paths: u.Dictionary<any> = {};

    // Init
    constructor( ctx: Context ) {
      super();
      this.context = ctx;
    }

    /*----------------------------------------------------------------
     * Ensure this sends only a single changed message between
     * updates.
     */
    reportChanged() {
      if (! this.changed) {
        this.changed = true;
        this.sendNext( this.context );
      }
    }

    /*----------------------------------------------------------------
     * Return all elements currently in the context.
     */
    getElements() {
      return (<ContextElement[]>this.elements).concat(
        u.concatmap( this.templates, function( tmpl: Template ) {
          return tmpl.getElements()
        } )
      );
    }

    /*----------------------------------------------------------------
     * Adds a static element to the context
     */
    addStatic( element: ContextElement ): boolean {
      var added = false;
      if (u.arraySet.remove( this.removed, element )) {
        added = true;
      }

      if (! u.arraySet.contains( this.elements, element ) &&
          u.arraySet.add( this.added, element )             ) {
        added = true;
        this.reportChanged();
      }

      return added;
    }

    /*----------------------------------------------------------------
     * Removes a static element to the context
     */
    removeStatic( element: ContextElement ): boolean {
      var removed = false;
      if (u.arraySet.remove( this.added, element )) {
        removed = true;
      }

      if (u.arraySet.contains( this.elements, element ) &&
          u.arraySet.add( this.removed, element )         ) {
        removed = true;
        this.reportChanged();
      }

      return removed;
    }

    /*----------------------------------------------------------------
     * Adds a template to the context
     */
    addTemplate( tmpl: Template ) {
      if (tmpl.isConstant()) {
        var changes: ContextChanges = {removes: [], adds: []};
        tmpl.update( changes );
        if (changes.adds.length > 0) {
          changes.adds.forEach( this.addStatic, this );
        }
        else {
          console.warn( "Could not instantiate constant template: " );
        }
      }
      else {
        if (u.arraySet.add( this.templates, tmpl )) {
          tmpl.addObserver( this );
        }
      }
    }

    /*----------------------------------------------------------------
     */
    update(): ContextChanges {
      var removed = this.removed;
      this.removed = [];
      if (removed.length > 0) {
        this.elements = u.arraySet.difference( this.elements, removed );
      }

      var added = this.added;
      this.added = [];
      if (added.length > 0) {
        Array.prototype.push.apply( this.elements, added );
      }

      var result = {adds: added, removes: removed};
      if (this.outdated.length > 0) {
        for (var i = 0, l = this.outdated.length; i < l; ++i) {
          this.outdated[i].update( result );
        }
        this.outdated = [];
      }

      this.changed = false;
      return result;
    }

    /*----------------------------------------------------------------
     * Implement Observable<Template>
     */
    onNext( tmpl: Template ) {
      this.outdated.push( tmpl );
      this.reportChanged();
    }
    onError() { }
    onCompleted() { }

    /*----------------------------------------------------------------
     * Implement PathLookup
     */
    get( name: string ) {
      var path = this.paths[name];
      if (! path) {
        path = this.paths[name] = new Path( this.context, name );
      }
      return path;
    }

    /*----------------------------------------------------------------
     * Overload addObserver so that subscribing to a context needing
     * updates results in automatic notification.
     */
    addObserver( observer: r.Observer<Context> ): r.Observer<Context>;
    addObserver( object: Object,
                 onNext: (value: Context) => void,
                 onError: (error: any) => void,
                 onCompleted: () => void        ): r.Observer<Context>;
    addObserver<U>( object: Object,
                    onNext: (value: Context, id?: U) => void,
                    onError: (error: any, id?: U) => void,
                    onCompleted: (id?: U) => void,
                    id: U                                  ): r.Observer<Context>;
    addObserver( object: Object,
                 onNext?: (value: Context, id?: any) => void,
                 onError?: (error: any, id?: any) => void,
                 onCompleted?: (id?: any) => void,
                 id?: any                                  ): r.Observer<Context> {
      var added: r.Observer<Context>;
      if (arguments.length == 1) {
        added = super.addObserver( <r.Observer<Context>>object );
      }
      else {
        added = super.addObserver( object, onNext, onError, onCompleted, id );
      }
      if (added && this.changed) {
        added.onNext( this.context );
      }
      return added;
    }
  }

  /*==================================================================
   * The context class itself has a hidden ContextData field; all
   *   other fields are user-defined context properties.
   * (Member functions of the context class are all static.)
   */
  export
  class Context {

    private
    '#hd_data': ContextData;

    [key: string]: any;

    /*----------------------------------------------------------------
     * Copies any fields found in init
     */
    constructor( spec?: ContextSpec, init?: u.Dictionary<any> ) {
      if (spec) {
        Context.construct( this, spec, init );
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
      if (init) {
        if (typeof init !== 'object') {
          throw "Invalid initialization object passed to Context.construct: " + init;
        }
      }
      else {
        init = {};
      }

      for (var i = 0, l = spec.constants.length; i < l; ++i) {
        var tspec = spec.constants[i];
        if (! (tspec.loc in ctx)) {
          Context.addConstant( ctx, spec.constants[i] );
        }
      }

      var variables = spec.variables.filter( function( vspec: VariableSpec ) {
        return ! (vspec.loc in ctx);
      } );

      // Initialized/min
      for (var i = variables.length - 1; i >= 0; --i) {
        var vspec = variables[i];
        if ((vspec.optional === Optional.Min &&
             (vspec.init !== undefined || init[vspec.loc] !== undefined)) ||
            (vspec.optional === Optional.Default &&
             init[vspec.loc] === undefined &&
             vspec.init !== undefined)) {
          Context.addVariable( ctx, vspec, init[vspec.loc] );
        }
      }

      // Uninitialized/min
      for (var i = variables.length - 1; i >= 0; --i) {
        var vspec = variables[i];
        if ((vspec.optional === Optional.Default || vspec.optional === Optional.Min) &&
            vspec.init === undefined &&
            init[vspec.loc] === undefined) {
          Context.addVariable( ctx, vspec, init[vspec.loc] );
        }
      }

      // Uninitialized/max
      for (var i = 0, l = variables.length; i < l; ++i) {
        var vspec = variables[i];
        if (vspec.optional === Optional.Max &&
            vspec.init === undefined &&
            init[vspec.loc] === undefined) {
          Context.addVariable( ctx, vspec, init[vspec.loc] );
        }
      }

      // Initialized/max
      for (var i = 0, l = variables.length; i < l; ++i) {
        var vspec = variables[i];
        if ((vspec.optional === Optional.Max &&
             (vspec.init !== undefined || init[vspec.loc] !== undefined)) ||
            (vspec.optional === Optional.Default &&
             init[vspec.loc] !== undefined)) {
          Context.addVariable( ctx, vspec, init[vspec.loc] );
        }
      }

      for (var i = 0, l = spec.nesteds.length; i < l; ++i) {
        var nspec = spec.nesteds[i];
        if (! (nspec.loc in ctx)) {
          Context.addNestedContext( ctx, nspec, init[nspec.loc] );
        }
      }

      for (var i = 0, l = spec.references.length; i < l; ++i) {
        var rspec = spec.references[i];
        if (! (rspec.loc in ctx)) {
          Context.addReference( ctx, rspec, init[rspec.loc] );
        }
      }

      for (var i = 0, l = spec.constraints.length; i < l; ++i) {
        Context.addConstraint( ctx, spec.constraints[i] );
      }

      for (var i = 0, l = spec.commands.length; i < l; ++i) {
        Context.addCommand( ctx, spec.commands[i] );
      }

      for (var i = 0, l = spec.touchDeps.length; i < l; ++i) {
        Context.addTouchDep( ctx, spec.touchDeps[i] );
      }

      for (var i = 0, l = spec.outputs.length; i < l; ++i) {
        Context.addOutput( ctx, spec.outputs[i] );
      }

      return ctx;
    }

    /*----------------------------------------------------------------
     */
    static
    addConstant( ctx: Context, spec: ConstantSpec ) {
      ctx[spec.loc] = spec.value;
    }

    /*----------------------------------------------------------------
     * Add variable
     */
    static
    addVariable( ctx: Context, spec: VariableSpec, init: any ) {
      var hd_data = ctx['#hd_data'];
      var vv = new Variable( spec.loc, init === undefined ? spec.init : init, spec.eq );
      if (spec.optional !== Optional.Default) {
        vv.optional = spec.optional;
      }
      else {
        vv.optional = (init === undefined ? Optional.Min : Optional.Max);
      }
      hd_data.addStatic( vv );
      ctx[spec.loc] = vv;
    }

    /*----------------------------------------------------------------
     * Add nested context
     */
    static
    addNestedContext( ctx: Context, spec: NestedSpec, init: u.Dictionary<any> ) {
      var hd_data = ctx['#hd_data'];
      var nested: Context;
      if (spec.klass) {
        nested = new spec.klass();
      }
      else {
        nested = new Context();
      }
      if (spec.spec) {
        Context.construct( nested, spec.spec );
      }
      hd_data.addStatic( nested );
      ctx[spec.loc] = nested;
    }

    /*----------------------------------------------------------------
     * Add dynamic reference
     */
    static
    addReference( ctx: Context, spec: ReferenceSpec, init: any ) {
      var prop = new r.BasicSignal<any>( init, spec.eq );
      Context.defineReferenceAccessors( ctx, spec.loc, prop );
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
    addConstraint( ctx: Context, spec: ConstraintSpec ) {
      var hd_data = ctx['#hd_data'];

      var tmpl = new ConstraintTemplate( spec, hd_data );
      hd_data.addTemplate( tmpl );

      if (spec.loc) {
        ctx[spec.loc] = tmpl;
      }
    }

    /*----------------------------------------------------------------
     * Add command
     */
    static
    addCommand( ctx: Context, spec: CommandSpec ) {
      var hd_data = ctx['#hd_data'];

      var tmpl = new CommandTemplate( spec, hd_data );
      hd_data.addTemplate( tmpl );

      if (spec.loc) {
        ctx[spec.loc] = tmpl;
      }
    }

    /*----------------------------------------------------------------
     * Add touch dependency
     */
    static
    addTouchDep( ctx: Context, spec: TouchDepSpec ) {
      var hd_data = ctx['#hd_data'];

      hd_data.addTemplate( new TouchDepTemplate( spec, hd_data ) );
    }

    /*----------------------------------------------------------------
     * Add output
     */
    static
    addOutput( ctx: Context, spec: OutputSpec ) {
      var hd_data = ctx['#hd_data'];

      hd_data.addTemplate( new OutputTemplate( spec, hd_data ) );
    }

    /*----------------------------------------------------------------
     * Update all templates which need it, but also record the changes
     *   which were made.
     */
    static
    update( ctx: Context ): ContextChanges {
      var hd_data = ctx['#hd_data'];

      return hd_data.update();
    }

    /*----------------------------------------------------------------
     * Getter
     */
    static
    changes( ctx: Context ): r.ProxyObservable<Context> {
      return ctx['#hd_data'];
    }

    /*----------------------------------------------------------------
     * Getter
     */
    static
    elements( ctx: Context ): ContextElement[] {
      var hd_data = ctx['#hd_data'];

      return hd_data.getElements();
    }

    /*----------------------------------------------------------------
     */
    static
    claim( ctx: Context, el: Context|Variable ): boolean {
      var hd_data = ctx['#hd_data'];

      return hd_data.addStatic( el );
    }

    /*----------------------------------------------------------------
     */
    static
    release( ctx: Context, el: Context|Variable ): boolean {
      var hd_data = ctx['#hd_data'];

      return hd_data.removeStatic( el );
    }

    /*----------------------------------------------------------------
     */
    static
    destruct( ctx: Context ) {
      var hd_data = ctx['#hd_data'];

      for (var i = 0, l = hd_data.templates.length; i < l; ++i) {
        hd_data.templates[i].destruct();
      }
    }
  }

  /*------------------------------------------------------------------
   * Rather than require every context subclass to call the context
   * constructor, we define a getter that creates it the first time it
   * is accessed.
   */
  Object.defineProperty( Context.prototype, '#hd_data', {
    get: function makeData() {
      var data = new ContextData( this );
      Object.defineProperty( this, '#hd_data', {configurable: true,
                                                enumerable: false,
                                                value: data
                                               }
                           );
      return data;
    }
  } );

}
