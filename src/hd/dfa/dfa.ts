/*####################################################################
 */

module hd.dfa {

  import u = hd.utility;

  /*==================================================================
   * The interface for a DFA
   */

  // Defines order of compile
  export enum Order { Low, High };

  export interface Dfa<NodeT> {

    // Order of compilation
    order: Order;

    // Create/return new node with given transition table
    addNode( transitions: u.Dictionary<NodeT> ): NodeT;

    // Get list of all nodes
    getNodes(): NodeT[];

    // Get transition table for a particular node
    getTransitions( node: NodeT ): u.Dictionary<NodeT>;

    // Set which node is the root (must be a node already in the DFA)
    setRoot( node: NodeT ): void;

    // Get the root node
    getRoot(): NodeT;

    // Create/return new node with given leaf value
    addLeaf( leaf: string ): NodeT;

    // Get value if parameter is leaf node; null if not a leaf
    getLeafValue( node: NodeT ): string;

  }

  /*==================================================================
   * A DFA in which nodes are simply unique strings.  Makes debugging
   * easy.  Required for compilation.
   *
   * Leaf nodes are simply the leaf value; ensures that leafs with the
   * same value use the same node.
   */

  export class SoftLinkedDfa {

    // Order of compilation
    order: Order;

    // Transition table for each node
    transitions: u.Dictionary<u.Dictionary<string>> = {};

    // Since all nodes are strings, we need a separate flag to keep
    // track of the leafs
    leafs: u.Dictionary<boolean> = {};

    // Pointer to root node
    root: string = null;

    // How many nodes we have (used to generate unique strings)
    count = 0;

    /*----------------------------------------------------------------
     * Create/return new node with given transition table
     */
    addNode( transitions: u.Dictionary<string> ): string {
      var id = 'n' + this.count++;
      if (this.count % 1000 == 0) {
        u.console.compile.error( this.count + ' nodes...' );
      }
      this.transitions[id] = transitions;
      return id;
    }

    /*----------------------------------------------------------------
     * Get list of all nodes
     */
    getNodes(): string[] {
      return Object.keys( this.transitions );
    }

    /*----------------------------------------------------------------
     * Get transition table for a particular node
     */
    getTransitions( node: string ): u.Dictionary<string> {
      return this.transitions[node];
    }

    /*----------------------------------------------------------------
     * Set which node is the root (must be a node already in the DFA)
     */
    setRoot( node: string ): void {
      this.root = node;
    }

    /*----------------------------------------------------------------
     * Get the root node
     */
    getRoot(): string {
      return this.root;
    }

    /*----------------------------------------------------------------
     * Create/return new node with given leaf value
     */
    addLeaf( leaf: string ): string {
      this.leafs[leaf] = true;
      return leaf;
    }

    /*----------------------------------------------------------------
     * Get value if parameter is leaf node; null if not a leaf
     */
    getLeafValue( node: string ): string {
      return this.leafs[node] ? node : null;
    }

  }

  /*==================================================================
   * More efficient implementation in which we use the transition
   * table itself to represent the node.
   *
   * Leaf nodes are simply the the leaf value; ensures that leafs with
   * the same value use the same node.
   */

  // Transition table type
  export interface TransitionTable extends u.Dictionary<TransitionTable> { }

  export class HardLinkedDfa {

    // Order of compilation
    order: Order;

    // List of all nodes
    nodes: TransitionTable[] = [];

    // Pointer to root node
    root: TransitionTable = null;

    /*----------------------------------------------------------------
     * Create/return new node with given transition table
     */
    addNode( transitions: u.Dictionary<TransitionTable> ): TransitionTable {
      this.nodes.push( transitions );
      return transitions;
    }

    /*----------------------------------------------------------------
     * Get list of all nodes
     */
    getNodes() {
      return this.nodes;
    }

    /*----------------------------------------------------------------
     * Get transition table for a particular node
     */
    getTransitions( node: TransitionTable ) {
      return node;
    }

    /*----------------------------------------------------------------
     * Set which node is the root (must be a node already in the DFA)
     */
    setRoot( node: TransitionTable ) {
      this.root = node;
    }

    /*----------------------------------------------------------------
     * Get the root node
     */
    getRoot() {
      return this.root;
    }

    /*----------------------------------------------------------------
     * Create/return new node with given leaf value
     */
    addLeaf( leaf: string ): u.Dictionary<TransitionTable> {
      return <any>leaf;
    }

    /*----------------------------------------------------------------
     * Get value if parameter is leaf node; null if not a leaf
     */
    getLeafValue( node: TransitionTable ): string {
      return (typeof node === 'string') ? <any>node : null;
    }

  }

  /*==================================================================
   * DFA simulation function
   */
  export function runDfa<NodeT>( dfa: Dfa<NodeT>,
                                 input: string[]  ): string {
    var node: NodeT = dfa.getRoot();
    var plan: string;
    var i = dfa.order == Order.High ? input.length - 1 : 0;
    var di = dfa.order == Order.High ? -1 : 1;

    while (node && ! (plan = dfa.getLeafValue( node ))) {
      var nextNode = dfa.getTransitions( node )[input[i]];
      if (nextNode) {
        node = nextNode;
      }
      i += di;
    }

    return plan ? plan : null;
  }

}