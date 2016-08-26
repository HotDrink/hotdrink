/*####################################################################
 * Planner which creates and simulates a DFA.
 */

module hd.plan {

  import u = hd.utility;
  import g = hd.graph;
  import d = hd.dfa;

  /*==================================================================
   * The planner object
   */
  export class ComposedPlanner {

    // The original constraint graph
    private cgraph: g.ReadOnlyConstraintGraph;

    // The graph of the single, composed constraint
    private compcgraph: g.ConstraintGraph = new g.CachingConstraintGraph();

    // The definition of the single, composed constraint
    private composite: d.CompositeConstraint;

    // The id of the composed method selected for the plan
    private selected: string;

    // The DFA object
    private dfa: d.Dfa<any>;

    // The strength assignment
    private strengths = new ListStrengthAssignment<string>();

    /*----------------------------------------------------------------
     * Initialize.
     */
    constructor( cgraph: g.ReadOnlyConstraintGraph ) {
      this.cgraph = cgraph;
      this.recompose();
    }

    /*----------------------------------------------------------------
     * Get list of optional constraints only in order from weakest
     * to strongest.
     */
    getOptionals() {
      return this.strengths.getList();
    }

    /*----------------------------------------------------------------
     * Reset all constraint strengths according to provided order from
     * weakest to strongest.  Any constraints not in the list are
     * assumed to be required.
     */
    setOptionals( order: string[] ) {
      this.strengths.setOptionals( order );
    }

    /*----------------------------------------------------------------
     * Remove single constraint from consideration.
     */
    removeOptional( cid: string ) {
      this.strengths.remove( cid );
    }

    /*----------------------------------------------------------------
     * Make constraint optional (if it isn't already) and give it the
     * highest strength of all optional constraints.
     */
    setMaxStrength( cid: string ) {
      this.strengths.setToMax( cid );
    }

    /*----------------------------------------------------------------
     * Make constraint optional (if it isn't already) and give it the
     * lowest strength of all optional constraints.
     */
    setMinStrength( cid: string ) {
      this.strengths.setToMin( cid );
    }

    /*----------------------------------------------------------------
     * Test whether first is stronger than second.
     */
    compare( cid1: string, cid2: string ): number {
      return this.strengths.compare( cid1, cid2 );
    }

    /*----------------------------------------------------------------
     * Run planning algorithm; return true if planning succeeded.
     */
    plan( sgraph: g.SolutionGraph, cidsToEnforce: string[] ): boolean {
      // If changes have been made to cgraph must rebuild DFA
      if (cidsToEnforce.some( g.isNotStayConstraint )) {
        this.recompose();
      }

      // Simulate DFA
      this.selected = d.runDfa( this.dfa, this.strengths.getList() );

      return this.selected ? true : false;
    }

    /*----------------------------------------------------------------
     * Get solution graph from last successful plan.
     */
    getSGraph(): g.SolutionGraph {
      var sgraph = new g.CachingSolutionGraph();
      this.cgraph.variables().forEach( sgraph.addVariable, sgraph );
      var selectedMethods = this.composite.compmids[this.selected];
      for (var i = 0, l = selectedMethods.length; i < l; ++i) {
        var mid = selectedMethods[i];
        sgraph.addMethod( mid,
                          this.cgraph.constraintForMethod( mid ),
                          this.cgraph.inputsForMethod( mid ),
                          this.cgraph.outputsForMethod( mid )
                        );
      }
      return sgraph;
    }

    /*----------------------------------------------------------------
     */
    recompose() {
      this.composite = d.composeAllConstraints( this.cgraph );

      this.compcgraph.methods().forEach( this.compcgraph.removeMethod,
                                         this.compcgraph
                                       );
      this.compcgraph.variables().forEach( this.compcgraph.removeVariable,
                                           this.compcgraph
                                         );

      this.cgraph.variables().forEach( this.compcgraph.addVariable,
                                       this.compcgraph
                                     );
      d.addCompositeMethods( this.compcgraph, this.cgraph, this.composite );

      this.dfa = new d.SoftLinkedDfa();
      d.compileToDfa( this.dfa, this.compcgraph, d.Order.High );
    }
  }

}
