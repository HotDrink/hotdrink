/*####################################################################
 * The Constraint class.
 */
module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

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

    /*----------------------------------------------------------------
     * Initialize members
     */
    constructor( id: string, name: string, variables: u.ArraySet<Variable> ) {
      this.id = id;
      this.name = name;
      this.variables = variables;
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