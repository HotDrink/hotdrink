/*####################################################################
 * The Model class.
 */
module hd.model {

  import r = hd.reactive;

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
    constraints: Constraint[] = [];
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

    // A modelcule serves as a generic container; the programmer can
    // assign variables and constraints to whatever properties he
    // wants.
    [key: string]: any;

    /*----------------------------------------------------------------
     * Create observable property to represent value
     */
    static
    defineProperty<T>( m: Modelcule, name: string, value: T, property: boolean ) {
      if (property) {
        var prop = new r.ObservableProperty<T>( value )
        Object.defineProperty( m, '$'+name, {configurable: true,
                                             enumerable: false,
                                             value: prop
                                            }
                             );
        Object.defineProperty( m, name, {configurable: true,
                                         enumerable: true,
                                         get: prop.get.bind( prop ),
                                         set: prop.set.bind( prop )
                                        }
                             );
      }
      else {
        m[name] = value;
      }
    }

    /*----------------------------------------------------------------
     * Static getter for constraints
     */
    static
    constraints( m: Modelcule ) {
      return m['#hd_data'].constraints;
    }

    /*----------------------------------------------------------------
     * Static getter for changes
     */
    static
    changes( m: Modelcule ) {
      return m['#hd_data'].changes;
    }

    /*----------------------------------------------------------------
     * Add variable to modelcule, optionally storing it as a property.
     */
    static
    addVariable( m: Modelcule, vv: Variable, name?: string, property?: boolean ) {
      if (name) { Modelcule.defineProperty( m, name, vv, property ); }
    }

    /*----------------------------------------------------------------
     * Add constraint to model, optionally storing it as a property.
     */
    static
    addConstraint( m: Modelcule, cc: Constraint, name?: string, property?: boolean ) {
      m['#hd_data'].constraints.push( cc );
      if (name) { Modelcule.defineProperty( m, name, cc, property ); }
      m['#hd_data'].changes.sendNext( {type: ModelculeEventType.addConstraint,
                                       constraint: cc}
                                    );
    }

    // The modelcule keeps its own records of what's inside of it in this
    // property.  It's pseudo-private -- the application programmer
    // shouldn't use it, but it may be used by other parts of the
    // system.
    '#hd_data': ModelculeData;  // initialized indirectly -- look beow class definition
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