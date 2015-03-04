/*####################################################################
 * The SolutionGraph interface and class.
 *
 * A SolutionGraph is just a constraint graph; however, it is defined
 * as a subgraph of another constraint graph.  In hypergraph
 * terminology, the solution graph contains all the nodes (variables)
 * of the original graph, and some but not all the hyperedges
 * (methods).  More specifically, the solution graph contains at most
 * one method from each constraint of the original constraint graph.
 *
 * To help enforce this, the solution graph keeps a pointer to the
 * constraint graph it is a subset of.  Rather than supporting the
 * arbitrary editing functions of ConstraintGraph, the SolutionGraph
 * only supports adding and removing methods of the original
 * constraint graph.
 */
module hd.graph {

  import u = hd.utility;

  /*==================================================================
   * Solution graph interface.
   */
  export interface SolutionGraph extends ReadOnlyConstraintGraph {
    selectMethod( cid: string,
                  mid: string,
                  inputs: u.ArraySet<string>,
                  outputs: u.ArraySet<string> ): void;
    selectedForConstraint( cid: string ): string;
  }

  /*==================================================================
   * A solution graph with light caching.
   */
  export class CachingSolutionGraph extends CachingConstraintGraph {

    /*----------------------------------------------------------------
     * Remove any hyperedges for specified constraint; then add
     * specified hyeredge.
     *
     * Note that it's fine if there are no hyperedges for the
     * specified constraint.  Similarly, "mid" may be "null" to
     * indicate that there should be no hyperedges for the specified
     * constraint.
     */
    selectMethod( cid: string,
                  mid: string,
                  inputs: u.ArraySet<string>,
                  outputs: u.ArraySet<string> ) {
      if (! mid) { mid = null; }

      var oldmid = this.selectedForConstraint( cid );
      if (oldmid != mid ) {
        if (oldmid) {
          this.removeMethod( oldmid );
        }

        if (mid) {
          this.addMethod( mid,
                          cid,
                          inputs,
                          outputs
                        );
        }
      }
    }

    /*----------------------------------------------------------------
     * Query which method for specified constraint is currently in
     * the solution graph.
     */
    selectedForConstraint( cid: string ) {
      var methods = this.methodsForConstraint( cid );
      return methods ? methods[0] : null;
    }
  }

}