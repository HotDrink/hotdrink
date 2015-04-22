/*####################################################################
 * Defines Planner interface.
 */

module hd.plan {

  import g = hd.graph;

  /*==================================================================
   * A Planner encapsulates a particular planning algorithm, along
   * with its associated data structures.  The two most important
   * data structures are
   * 1. A representation for stay constraint strengths.  The planner
   *    can represent this however it chooses, as long as it supports
   *    the operations for modifying strengths.
   * 2. A representation for the solution.  Again, this can be any
   *    representation, as long as it can be converted to a solution
   *    graph upon request.
   *
   * Every Planner is tied to one particular constraint graph,
   * specified upon creation.  Therefore, all planner methods should
   * be understood in the context of that one constraint graph.  So
   * when you promote a constraint strength, that constraint must be
   * in the constraint graph; when you plan, you plan over the
   * constraint graph; etc.
   *
   * The Planner is responsible for responding to changes in the
   * constraint graph.  It can do this by adding an observer to the
   * constraint graph -- since constraint graphs publish all their
   * changes.  For example, incremental planners will need to make
   * updates to the solution graph when variables or constraints are
   * added or removed.  (This is not necessary for non-incremental
   * planners since the entire solution graph will be regenerated on
   * the next plan operation.)  Also, the strength assignment should
   * always be over the constraints in the graph.  So constraints
   * removed from the graph should no longer have a strength;
   * constraints added to the graph should be considered required
   * until explicitly given an optional strength.
   */
  export interface Planner {

    /*----------------------------------------------------------------
     * Get list of optional constraints only in order from weakest
     * to strongest.
     */
    getOptionals(): string[];

    /*----------------------------------------------------------------
     * Reset all constraint strengths according to provided order from
     * weakest to strongest.  Any constraints not in the list are
     * assumed to be required.
     */
    setOptionals( order: string[] ): void;

    /*----------------------------------------------------------------
     * Remove single constraint from consideration.
     */
    removeOptional( cid: string ): void;

    /*----------------------------------------------------------------
     * Make constraint optional (if it isn't already) and give it the
     * highest strength of all optional constraints.
     */
    setMaxStrength( cid: string ): void;

    /*----------------------------------------------------------------
     * Make constraint optional (if it isn't already) and give it the
     * lowest strength of all optional constraints.
     */
    setMinStrength( cid: string ): void;

    /*----------------------------------------------------------------
     * Test whether first is stronger than second.
     */
    compare( cid1: string, cid2: string ): number;

    /*----------------------------------------------------------------
     * Run planning algorithm; return true if planning succeeded.
     * Stores results internally so that solution graph can be
     * requested if desired.
     */
    plan( sgraph: g.SolutionGraph, cidsToEnforce: string[] ): boolean;

    /*----------------------------------------------------------------
     * Get solution graph from last successful plan.  The solution
     * graph should be considered invalid once any changes are made
     * to the constraint graph.  Also, the solution graph should not
     * be modified, since incremental algorithms may reuse it.
     */
    getSGraph(): g.SolutionGraph;

  }

  /*------------------------------------------------------------------
   * When creating a planner you give it a reference to the constraint
   * graph it is associated with.
   */
  export interface PlannerType {

    new( cgraph: g.ReadOnlyConstraintGraph ): Planner;

  }

}