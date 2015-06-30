/*####################################################################
 * The Context class.
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  /*==================================================================
   * Interface for anything which needs to know when the context grows
   * (e.g. RunTime).
   */
  export
  enum ContextEventType {addConstraint, removeConstraint}

  export
  interface ContextEvent {
    type: ContextEventType;
    constraint?: Constraint;
  }

  /*==================================================================
   * Used by a context to keep track of what it contains.
   */
  export class ContextData {
    templates: u.ArraySet<ConstraintTemplate> = [];
    constraints: u.ArraySet<Constraint> = [];
    changes = new r.BasicObservable<ContextEvent>();
  }

  /*==================================================================
   * A context has two purposes.
   *
   * The first is to act as a container for variables and constraints,
   * allowing a way to refer to them.  When ContextBuilder is given a
   * name for, say, the input to a method, it looks the name up in the
   * context.
   *
   * The second purpose is to server as a component -- a building
   * block for composing large contexts.  That one I haven't quite
   * worked out yet.  Until I do, this at least enforces the idea of a
   * context being contained in an object, as opposed to a gobal context.
   */
  export class Context {

    // The context keeps its own records of what's inside of it in this
    // property.  It's pseudo-private -- the application programmer
    // shouldn't use it, but it may be used by other parts of the
    // system.
    '#hd_data': ContextData;  // initialized indirectly -- look below class definition

    // A context serves as a generic container; the programmer can
    // assign variables and constraints to whatever properties he
    // wants.
    [key: string]: any;

    /*----------------------------------------------------------------
     * Create observable property to represent value
     */
    static
    defineProperty<T>( mod: Context, name: string, value?: T, eq?: u.EqualityPredicate<T> ) {
      var prop = new r.ObservableProperty<T>( value, eq );
      Object.defineProperty( mod, '$'+name, {configurable: true,
                                             enumerable: false,
                                             value: prop
                                            }
                           );
      Object.defineProperty( mod, name, {configurable: true,
                                         enumerable: true,
                                         get: prop.get.bind( prop ),
                                         set: prop.set.bind( prop )
                                        }
                           );
    }

    /*----------------------------------------------------------------
     * Static getter for constraints
     */
    static
    constraints( mod: Context ) {
      return mod['#hd_data'].constraints;
    }

    /*----------------------------------------------------------------
     * Static getter for changes
     */
    static
    changes( mod: Context ) {
      return mod['#hd_data'].changes;
    }

    /*----------------------------------------------------------------
     * Add variable to context, optionally storing it as a property.
     */
    static
    addVariable( mod: Context, vv: Variable, name: string, property?: boolean ) {
      if (property) {
        Context.defineProperty( mod, name, vv );
      }
      else {
        mod[name] = vv;
      }
    }

    /*----------------------------------------------------------------
     * Add variable to context according to spec.
     */
    static
    addVariableSpec( mod: Context, vspec: VariableSpec, vv?: Variable ) {
      if (vspec.ref) {
        Context.defineProperty( mod, vspec.name, vv );
      }
      else {
        if (! vv) {
          vv = new Variable( vspec.name, vspec.value, vspec.eq, vspec.output );
        }
        mod[vspec.name] = vv;
      }
    }

    /*----------------------------------------------------------------
     * Add constraint to context.
     */
    static
    addConstraint( mod: Context, cc: Constraint ) {
      u.arraySet.addKnownDistinct( mod['#hd_data'].constraints, cc );
      mod['#hd_data'].changes.sendNext( {type: ContextEventType.addConstraint,
                                         constraint: cc
                                        }
                                      );
    }

    /*----------------------------------------------------------------
     * Add constraint to context according to spec.
     */
    static
    addConstraintSpec( mod: Context, cspec: ConstraintSpec ) {
      var template = new ConstraintTemplate( mod, cspec );
      u.arraySet.addKnownDistinct( mod['#hd_data'].templates, template );
    }

  }

  /*==================================================================
   * I have the idea that, at some point, we may want to allow the
   * programmer to create his own subclasses of Context.
   *
   * Rather than require every context subclass to call the context
   * constructor, we define a getter that creates it the first time it
   * is accessed.
   */
  Object.defineProperty( Context.prototype, '#hd_data', {
    get: function makeData() {
      var data = new ContextData();
      Object.defineProperty( this, '#hd_data', {value: data} );
      return data;
    }
  } );

}