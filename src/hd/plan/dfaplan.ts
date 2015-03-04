/*####################################################################
 * Planner using compiled DFA function.
 */
module hd.plan {

  import u = hd.utility;
  import g = hd.graph;
  import d = hd.dfa;

  /*==================================================================
   * Interface for compiled DFA function.
   */
  export interface DfaFn {
    (priorities: number[]): string[]
  }

  /*==================================================================
   * The planner object.
   */
  export class DfaFnPlanner {

    // The constraint graph we are planning for
    private cgraph: g.ReadOnlyConstraintGraph;

    // Map stay constraints to an index number
    private cidIndexes: u.Dictionary<number> = {};
    private cidCount = 0;

    // Map index number to method id
    private mids: string[];

    // The strength assignment
    private strengths = new ListStrengthAssignment<number>();

    // The compiled DFA function
    private fn: DfaFn;

    // Methods selected by last plan
    private selectedMethods: number[];

    /*----------------------------------------------------------------
     * Initialize.
     */
    constructor( cidIndexes: u.Dictionary<number>,
                 mids: string[],
                 fn: DfaFn,
                 cgraph: g.ReadOnlyConstraintGraph ) {
      this.cidIndexes = cidIndexes;
      this.cidCount = Object.keys( cidIndexes ).length;
      this.mids = mids;
      this.fn = fn;
      this.cgraph = cgraph;
    }

    /*----------------------------------------------------------------
     * Get list of optional constraints only in order from weakest
     * to strongest.
     */
    getOptionals() {
      var reverseMap: string[] = [];
      for (var cid in this.cidIndexes) {
        reverseMap[this.cidIndexes[cid]] = cid;
      }
      return this.strengths.getList().map( function( idx: number ) {
        return reverseMap[idx];
      } );
    }

    /*----------------------------------------------------------------
     * Reset all constraint strengths according to provided order from
     * weakest to strongest.  Any constraints not in the list are
     * assumed to be required.
     */
    setOptionals( order: string[] ) {
      for (var i = 0, l = order.length; i < l; ++i) {
        var cid = order[i];
        if (! (cid in this.cidIndexes)) {
          this.cidIndexes[cid] = this.cidCount++;
        }
      }
      this.strengths.setOptionals( order.map( function( cid: string ) {
        return this.cidIndexes[cid];
      }, this ) );
    }

    /*----------------------------------------------------------------
     * Remove single constraint from consideration.
     */
    removeOptional( cid: string ) {
      console.error( "Cannot make modifications to constraint graph with DFA planner" );
    }

    /*----------------------------------------------------------------
     * Make constraint optional (if it isn't already) and give it the
     * highest strength of all optional constraints.
     */
    setMaxStrength( cid: string ) {
      var idx = this.cidIndexes[cid];
      if (idx === undefined) {
        idx = this.cidIndexes[cid] = this.cidCount++;
      }
      this.strengths.setToMax( idx );
    }

    /*----------------------------------------------------------------
     * Make constraint optional (if it isn't already) and give it the
     * lowest strength of all optional constraints.
     */
    setMinStrength( cid: string ) {
      var idx = this.cidIndexes[cid];
      if (idx === undefined) {
        idx = this.cidIndexes[cid] = this.cidCount++;
      }
      this.strengths.setToMin( idx );
    }

    /*----------------------------------------------------------------
     * Test whether first is stronger than second.
     */
    isStronger( cid1: string, cid2: string ) {
      return this.strengths.stronger( this.cidIndexes[cid1],
                                      this.cidIndexes[cid2]
                                    );
    }

    /*----------------------------------------------------------------
     * Run planning algorithm; return true if planning succeeded.
     */
    plan(): boolean {
      var selectedMethods = this.fn.call( null, this.strengths.getList() );
      if (selectedMethods) {
        this.selectedMethods = selectedMethods;
        return true;
      }
      else {
        return false;
      }
    }

    /*----------------------------------------------------------------
     * Get solution graph from last successful plan.
     */
    getSGraph(): g.SolutionGraph {
      var sgraph = new g.CachingSolutionGraph();
      this.cgraph.variables().forEach( sgraph.addVariable, sgraph );
      for (var i = 0, l = this.selectedMethods.length; i < l; ++i) {
        var mid = this.mids[this.selectedMethods[i]];
        sgraph.addMethod( mid,
                          this.cgraph.constraintForMethod( mid ),
                          this.cgraph.inputsForMethod( mid ),
                          this.cgraph.outputsForMethod( mid )
                        );
      }
      return sgraph;
    }

  }

  // For type checking
  if (false) {
    var p: Planner = new DfaFnPlanner( null, null, null, null );
  }

}