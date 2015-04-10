/*####################################################################
 * The Model class.
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  export
  interface VariableSpec {
    name: string;
    ref: boolean;
    value: any;
    eq: u.EqualityPredicate<any>;
    output: boolean;
  }

  export
  interface MethodSpec {
    inputs: string[];
    outputs: string[];
    fn: Function;
  }

  /*==================================================================
   * Interface for anything which needs to know when the model grows
   * (e.g. RunTime).
   */
  export
  enum ModelculeEventType {addConstraint, removeConstraint}

  export
  interface ModelculeEvent {
    type: ModelculeEventType;
    constraint?: Constraint;
  }

  /*==================================================================
   * Used by a model to keep track of what it contains.
   */
  export class ModelculeData {
    templates: u.ArraySet<ConstraintTemplate> = [];
    constraints: u.ArraySet<Constraint> = [];
    changes = new r.BasicObservable<ModelculeEvent>();
  }

  /*==================================================================
   * A modelcule has two purposes.
   *
   * The first is to act as a container for variables and constraints,
   * allowing a way to refer to them.  When ModelBuilder is given a
   * name for, say, the input to a method, it looks the name up in the
   * model.
   *
   * The second purpose is to server as a component -- a building
   * block for composing large models.  That one I haven't quite
   * worked out yet.  Until I do, this at least enforces the idea of a
   * model being contained in an object, as opposed to a gobal model.
   */
  export class Modelcule {

    // The modelcule keeps its own records of what's inside of it in this
    // property.  It's pseudo-private -- the application programmer
    // shouldn't use it, but it may be used by other parts of the
    // system.
    '#hd_data': ModelculeData;  // initialized indirectly -- look below class definition

    // A modelcule serves as a generic container; the programmer can
    // assign variables and constraints to whatever properties he
    // wants.
    [key: string]: any;

    /*----------------------------------------------------------------
     * Create observable property to represent value
     */
    static
    defineProperty<T>( mod: Modelcule, name: string, value?: T, eq?: u.EqualityPredicate<T> ) {
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
    constraints( mod: Modelcule ) {
      return mod['#hd_data'].constraints;
    }

    /*----------------------------------------------------------------
     * Static getter for changes
     */
    static
    changes( mod: Modelcule ) {
      return mod['#hd_data'].changes;
    }

    /*----------------------------------------------------------------
     * Add variable to modelcule, optionally storing it as a property.
     */
    static
    addVariable( mod: Modelcule, vv: Variable, name: string, property?: boolean ) {
      if (property) {
        Modelcule.defineProperty( mod, name, vv );
      }
      else {
        mod[name] = vv;
      }
    }

    /*----------------------------------------------------------------
     * Add variable to modelcule according to spec.
     */
    static
    addVariableSpec( mod: Modelcule, vspec: VariableSpec, vv?: Variable ) {
      if (vspec.ref) {
        Modelcule.defineProperty( mod, vspec.name, vv );
      }
      else {
        if (! vv) {
          vv = new Variable( vspec.name, vspec.value, vspec.eq, vspec.output );
        }
        mod[vspec.name] = vv;
      }
    }

    /*----------------------------------------------------------------
     * Add constraint to modelcule.
     */
    static
    addConstraint( mod: Modelcule, cc: Constraint ) {
      u.arraySet.addKnownDistinct( mod['#hd_data'].constraints, cc );
      mod['#hd_data'].changes.sendNext( {type: ModelculeEventType.addConstraint,
                                         constraint: cc
                                        }
                                      );
    }

    /*----------------------------------------------------------------
     * Add constraint to modelcule according to spec.
     */
    static
    addConstraintSpec( mod: Modelcule, cspec: ConstraintSpec ) {
      var template = new ConstraintTemplate( mod, cspec );
      u.arraySet.addKnownDistinct( mod['#hd_data'].templates, template );
    }

  }

  /*==================================================================
   * I have the idea that, at some point, we may want to allow the
   * programmer to create his own subclasses of Modelcule.
   *
   * Rather than require every model subclass to call the model
   * constructor, we define a getter that creates it the first time it
   * is accessed.
   */
  Object.defineProperty( Modelcule.prototype, '#hd_data', {
    get: function makeData() {
      var data = new ModelculeData();
      Object.defineProperty( this, '#hd_data', {value: data} );
      return data;
    }
  } );

}