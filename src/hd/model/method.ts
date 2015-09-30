/*####################################################################
 * The Method class.
 */

module hd.config {
  export
  var forwardPriorGens = false;
}

module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  /*==================================================================
   *  A method is an operation that is part of a constraint.  As such,
   *  it keeps track of input and output variables as they appear in
   *  the constraint graph.  Every input should be in inputVars, every
   *  output should be in outputVars.
   */
  export class Method {

    // Unique identifier; assigned by Factory
    id: string;

    // Human readable name for programmer
    name: string;

    // Function that implements this operation
    fn: Function;

    // Alternative to fn -- a hard-coded function result
    result: any;

    // Inputs to pass to the function, in the order they should be passed
    // Variables in this list will be replaced with their value; everything
    // else will be treated as constants to be passed to the function.
    inputs: any[];

    // Parallel to inputs; true means input comes from prior generation
    priorFlags: boolean[];

    // Outputs to write to, in the order they are returned form the function
    outputs: Variable[];

    // Is this an external operation?  (Does it trigger an update after execution?)
    external = false;

    // Set of variables used as input by this method.
    // Unlike "inputs" this list contains only variables
    //   and does not contain duplicates.
    inputVars: u.ArraySet<Variable>;

    /*----------------------------------------------------------------
     * Initialize members
     */
    constructor( name: string,
                 fn: any,
                 inputs: any[],
                 priorFlags: boolean[],
                 outputs: Variable[],
                 inputVars: u.ArraySet<Variable> ) {
      this.id = makeId( name );
      this.name = name;
      if (typeof fn === 'function') {
        this.fn = fn;
      }
      else {
        this.result = fn;
      }
      this.inputs = inputs;
      this.priorFlags = priorFlags;
      this.outputs = outputs;
      this.inputVars = inputVars;
    }

    /*----------------------------------------------------------------
     * Human readable name
     */
    toString(): string {
      return this.name;
    }
  }

}
