/*####################################################################
 * The Constraint class.
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  export const
  enum Optional { Default, Max, Min };

  /*==================================================================
   * A constraint in the property model.
   */
  export class Constraint {

    // Static constants for min/max strength
    static WeakestStrength = Number.MIN_VALUE;
    static RequiredStrength = Number.MAX_VALUE;

    // Unique identifier; assigned by Factory
    id: string;

    // Human readable name for programmer
    name: string;

    // Variables used by this constraint
    variables: u.ArraySet<Variable> = [];

    // Methods in this constraint
    methods: u.ArraySet<Method> = [];

    // Is this constraint optional, and, if so, should it be added
    //   with max or min priority?
    optional: Optional = Optional.Default;

    touchVariables: u.ArraySet<Variable>;

    /*----------------------------------------------------------------
     * Initialize members
     */
    constructor( name: string,
                 variables: u.ArraySet<Variable>,
                 touchVariables?: u.ArraySet<Variable> ) {
      this.id = makeId( name );
      this.name = name;
      this.variables = variables;
      if (touchVariables && touchVariables.length) {
        this.touchVariables = touchVariables;
      }
    }

    /*----------------------------------------------------------------
     * Human readable name
     */
    toString(): string {
      return this.name;
    }

    /*----------------------------------------------------------------
     * Add new method to constraint
     */
    addMethod( method: Method ) {
      (<Method[]>this.methods).push( method );
    }

  }

}
