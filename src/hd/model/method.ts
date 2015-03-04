/*####################################################################
 * The Method class.
 */
module hd.model {

  import u = hd.utility;

  /*==================================================================
   * A method in the property model.
   */
  export class Method {

    // Unique identifier; assigned by Factory
    id: string;

    // Human readable name for programmer
    name: string;

    // Function that implements this method
    fn: Function;

    // Inputs to pass to the function, in the order they should be passed
    // Variables in this list will be replaced with their value; everything
    // else will be treated as constants to be passed to the function.
    inputs: any[];

    // Outputs to write to, in the order they are returned form the function
    // Variables in this list will be assigned their corresponding value;
    // everything else will cause the corresponding output to be ignored.
    outputs: any[];

    // Set of variables used as input by this method.
    // Unlike "inputs" this list contains only variables
    //   and does not contain duplicates.
    inputVars: u.ArraySet<Variable>;

    // Set of variables used as output by this method.
    // Unlike "outputs" this list contains only variables
    //   and does not contain duplicates.
    outputVars: u.ArraySet<Variable>;

    /*----------------------------------------------------------------
     * Initialize members
     */
    constructor( id: string,
                 name: string,
                 inputVars: u.ArraySet<Variable>,
                 outputVars: u.ArraySet<Variable>,
                 fn: Function,
                 inputs: any[],
                 outputs: any[]                   ) {
      this.id = id;
      this.name = name;
      this.inputVars = inputVars;
      this.outputVars = outputVars;
      this.fn = fn;
      this.inputs = inputs;
      this.outputs = outputs;
    }

    /*----------------------------------------------------------------
     * Human readable name
     */
    toString(): string {
      return this.name;
    }

  }

}