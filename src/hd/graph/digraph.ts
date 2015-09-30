/*####################################################################
 * The hd.graph.Digraph class.
 */
module hd.graph {

  import u = hd.utility;

  /*==================================================================
   * A directed graph.
   */
  export class Digraph<LabelT> {

    // Labels for nodes which have one
    labels: u.Dictionary<LabelT> = {};

    // All incoming edges
    ins: u.Dictionary<u.Dictionary<boolean>> = {};

    // All outgoing edges
    outs: u.Dictionary<u.Dictionary<boolean>> = {};

    /*----------------------------------------------------------------
     * Is node in the graph?
     */
    hasNode( n: string ): boolean {
      return n in this.outs;
    }

    /*----------------------------------------------------------------
     * Is edge in the graph?
     */
    hasEdge( from: string, to: string ): boolean {
      return this.hasNode( from ) && this.outs[from][to];
    }

    /*----------------------------------------------------------------
     * Getter for node label.
     */
    getLabel( n: string ): LabelT {
      return this.labels[n];
    }

    /*----------------------------------------------------------------
     * Setter for node label.
     */
    setLabel( n: string, label: LabelT ): void {
      if (label === undefined) {
        delete this.labels[n];
      }
      else {
        this.labels[n] = label;
      }
    }

    /*----------------------------------------------------------------
     * Add node to the graph.  Has no effect if node already in graph.
     */
    addNode( n: string, label?: LabelT ): void {
      if (! this.outs[n]) {
        if (label !== undefined) {
          this.labels[n] = label;
        }
        this.outs[n] = {};
        this.ins[n] = {};
      }
    }

    /*----------------------------------------------------------------
     * Add edge to the graph.
     */
    addEdge( from: string, to: string ): void {
      this.addNode( from );
      this.addNode( to );
      this.outs[from][to] = true;
      this.ins[to][from] = true;
    }

    /*----------------------------------------------------------------
     * Curried version of addEdge - returns a function which can be
     * used to add edges going to specified node.
     */
    addEdgeTo( to: string ) {
      var graph = this;
      return function( from: string ) {
        graph.addEdge( from, to );
      }
    }

    /*----------------------------------------------------------------
     * Curried version of addEdge - returns a function which can be
     * used to add edges coming from specified node.
     */
    addEdgeFrom( from: string ) {
      var graph = this;
      return function( to: string ) {
        graph.addEdge( from, to );
      }
    }

    /*----------------------------------------------------------------
     * Remove node from the graph.
     */
    removeNode( n: string ): void {
      delete this.labels[n];
      for (var to in this.outs[n]) {
        delete this.ins[to][n];
      }
      for (var from in this.ins[n]) {
        delete this.outs[from][n];
      }
      delete this.outs[n];
      delete this.ins[n];
    }

    /*----------------------------------------------------------------
     * Remove edge from the graph.
     */
    removeEdge( from: string, to: string ): void {
      delete this.outs[from][to];
      delete this.ins[to][from];
    }

    /*----------------------------------------------------------------
     * All nodes in the graph.
     */
    getNodes(): u.ArraySet<string> {
      return Object.keys( this.outs );
    }

    /*----------------------------------------------------------------
     * Only nodes which have labels.
     */
    getLabeledNodes(): u.ArraySet<string> {
      return Object.keys( this.labels );
    }

    /*----------------------------------------------------------------
     * Only nodes which do not have labels.
     */
    getUnlabeledNodes(): u.ArraySet<string> {
      return Object.keys( this.outs ).filter( function( id: string ) {
        return ! (id in this.labels);
      } );
    }

    /*----------------------------------------------------------------
     * All outgoing edges for one particular node.
     */
    getOutsFor( n: string ): u.ArraySet<string> {
      var ns: string[] = [];
      var outs = this.outs[n];
      for (var n2 in outs) {
        if (outs[n2]) {
          ns.push( n2 );
        }
      }
      return ns;
    }

    /*----------------------------------------------------------------
     * All incoming edges for one particular node.
     */
    getInsFor( n: string ): u.ArraySet<string> {
      var ns: string[] = [];
      var ins = this.ins[n];
      for (var n2 in ins) {
        if (ins[n2]) {
          ns.push( n2 );
        }
      }
      return ns;
    }
  }

  /*==================================================================
   * DfsWalker for a Graph.  Can walk over outgoing edges for
   * downstream traversal, or incoming edges for upstream traversal.
   */
  export class DigraphWalker extends DfsWalker {

    /*----------------------------------------------------------------
     * Stores digraph so that it can access its incoming and outgoing
     * edges as needed.
     */
    constructor( private digraph: Digraph<any> ) {
      super();
    }

    /*----------------------------------------------------------------
     * All nodes downstream from starting nodes.
     */
    nodesDownstream( starting: string ): ResultSet<DigraphWalker>;
    nodesDownstream( starting: u.ArraySet<string> ): ResultSet<DigraphWalker>;
    nodesDownstream( starting: any ): ResultSet<DigraphWalker> {
      this.edges = this.digraph.outs;
      return <ResultSet<DigraphWalker>>this.collect( 0, starting );
     }

    /*----------------------------------------------------------------
     * All nodes downstream from starting nodes that are the same
     * type as starting nodes.
     */
    nodesDownstreamSameType( starting: string ): ResultSet<DigraphWalker>;
    nodesDownstreamSameType( starting: u.ArraySet<string> ): ResultSet<DigraphWalker>;
    nodesDownstreamSameType( starting: any ): ResultSet<DigraphWalker> {
      this.edges = this.digraph.outs;
      return <ResultSet<DigraphWalker>>this.collect( 1, starting );
     }

    /*----------------------------------------------------------------
     * All nodes downstream from starting nodes that are not the same
     * type as starting nodes.
     */
    nodesDownstreamOtherType( starting: string ): ResultSet<DigraphWalker>;
    nodesDownstreamOtherType( starting: u.ArraySet<string> ): ResultSet<DigraphWalker>;
    nodesDownstreamOtherType( starting: any ): ResultSet<DigraphWalker> {
      this.edges = this.digraph.outs;
      return <ResultSet<DigraphWalker>>this.collect( -1, starting );
     }

    /*----------------------------------------------------------------
     * All nodes upstream from starting nodes.
     */
    nodesUpstream( starting: string ): ResultSet<DigraphWalker>;
    nodesUpstream( starting: u.ArraySet<string> ): ResultSet<DigraphWalker>;
    nodesUpstream( starting: any ): ResultSet<DigraphWalker> {
      this.edges = this.digraph.ins;
      return <ResultSet<DigraphWalker>>this.collect( 0, starting );
     }

    /*----------------------------------------------------------------
     * All nodes upstream from starting nodes that are the same
     * type as starting nodes.
     */
    nodesUpstreamSameType( starting: string ): ResultSet<DigraphWalker>;
    nodesUpstreamSameType( starting: u.ArraySet<string> ): ResultSet<DigraphWalker>;
    nodesUpstreamSameType( starting: any ): ResultSet<DigraphWalker> {
      this.edges = this.digraph.ins;
      return <ResultSet<DigraphWalker>>this.collect( 1, starting );
     }

    /*----------------------------------------------------------------
     * All nodes upstream from starting nodes that are not the same
     * type as starting nodes.
     */
    nodesUpstreamOtherType( starting: string ): ResultSet<DigraphWalker>;
    nodesUpstreamOtherType( starting: u.ArraySet<string> ): ResultSet<DigraphWalker>;
    nodesUpstreamOtherType( starting: any ): ResultSet<DigraphWalker> {
      this.edges = this.digraph.ins;
      return <ResultSet<DigraphWalker>>this.collect( -1, starting );
     }

  }

}
