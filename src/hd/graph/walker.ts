/*####################################################################
 * GraphWalker and DigraphWalker for performing depth-first
 * traversals.
 *
 * This was written for bipartite graphs, so traversal methods include
 * the option to visit every node or every other node.
 */
module hd.graph {

  import u = hd.utility;

  export interface ResultSet<WalkerType> extends u.ArraySet<string> {
    and?() : WalkerType;
  }

  /*==================================================================
   * Base class for walkers.  Has the actual traversal methods --
   * subclasses just provide traversal parameters.
   */
  export class DfsWalker {

    // Every node visited by the walker
    private visited: u.Dictionary<boolean> = {};

    // Nodes collected by the walker
    private collected: ResultSet<DfsWalker> = [];

    // Traversal parameter: the edges in the graph which should be traversed
    edges: u.Dictionary<u.Dictionary<boolean>>;

    /*----------------------------------------------------------------
     * Special method for collected array
     */
    constructor() {
      var walker = this;
      this.collected.and = function() { return walker; }
    }

    /*----------------------------------------------------------------
     * Get all nodes collected by the walker.
     */
    result(): u.ArraySet<string> {
      return this.collected;
    }

    /*----------------------------------------------------------------
     * Generic traversal function.
     * The "visit" parameter should be 0 for all nodes,
     * 1 for every other node beginning with the starting node, or
     * -1 for every other node beginning with the subsequent nodes.
     */
    collect( visit: number, starting: string ): ResultSet<DfsWalker>;
    collect( visit: number, starting: u.ArraySet<string> ): ResultSet<DfsWalker>;
    collect( visit: number, starting: any ): ResultSet<DfsWalker> {
      if (Array.isArray( starting )) {
        (<u.ArraySet<string>>starting).forEach( function( n ) {
          this.collectRec( visit, n );
        }, this );
      }
      else {
        this.collectRec( visit, <string>starting );
      }
      return this.collected;
    }

    /*----------------------------------------------------------------
     * The actual recursive traversal function.
     */
    private collectRec( visit: number, nid: string ): void {
      if (this.visited[nid]) { return; }
      this.visited[nid] = true;
      if (visit >= 0) {
        // We know this is unique, so just push
        (<string[]>this.collected).push( nid );
      }
      var toEdges = this.edges[nid];
      for (var n2id in toEdges) {
        this.collectRec( -visit, n2id );
      }
    }

  }

}