/*####################################################################
 */

module hd.dfa {

  import u = hd.utility;
  import g = hd.graph;

  /*==================================================================
   * Actual compilation function.  Sets up and runs builder.
   */
  export function compileToDfa<NodeT>( dfa: Dfa<NodeT>,
                                       cgraph: g.ReadOnlyConstraintGraph,
                                       order: Order                       ) {

    // We're only interested in required constraints
    var cids = cgraph.constraints().filter( g.isNotStayConstraint );

    // Assert: all the constraints have been composed to a single constraint
    if (cids.length != 1) {
      console.error( 'Cannot compile a constraint graph to a decision tree unless it consists of a single constraint' );
      return;
    }
    // Now we know the plans are just the methods of our one constraint

    // Map each plan to the stay constraints for its inputs
    var planInputs: u.Dictionary<u.ArraySet<string>> = {};
    var mids = cgraph.methodsForConstraint( cids[0] );
    for (var i = 0, l = mids.length; i < l; ++i) {
      var mid = mids[i];
      var midInputs = cgraph.inputsForMethod( mid );
      planInputs[mid] = midInputs.map( g.stayConstraint );
    }

    // Create list of all stay constraints
    var dfaInputs = cgraph.variables().map( g.stayConstraint );

    // Build the DFA
    var builder = new DfaBuilder<NodeT>( planInputs, dfaInputs );
    builder.buildDfa( dfa, order );
  }

  /*==================================================================
   * DFA building algorithm
   */
  class DfaBuilder<NodeT> {

    // The dfa we are building
    private dfa: Dfa<NodeT>;

    // Maps a "plan" (composite method id) to the stay constraints of its inputs
    private planInputs: u.Dictionary<u.ArraySet<string>>;

    // List of the possible stay constraint indexes
    private inputs: u.ArraySet<string>;

    // Cache of nodes created indexed by path
    private pathCache: u.Dictionary<NodeT> = {};

    // Cache of nodes created indexed by transition table
    private transCache: u.Dictionary<NodeT> = {};

    // Used for debug output
    private count = 0;
    private max = 0;

    /*----------------------------------------------------------------
     * Initialize
     */
    constructor( planInputs: u.Dictionary<u.ArraySet<string>>,
                 inputs: u.ArraySet<string>                    ) {
      this.planInputs = planInputs;
      this.inputs = inputs;
    }

    /*----------------------------------------------------------------
     * Entry point
     */
    buildDfa( dfa: Dfa<NodeT>, order: Order ) {
      this.dfa = dfa;
      this.dfa.order = order;
      this.count = 0;
      this.max = this.inputs.length * (this.inputs.length - 1);

      if (order == Order.Low) {
        dfa.setRoot( this.buildLowTreeNode( [], <string[]>this.inputs ) );
      }
      else {
        dfa.setRoot( this.buildHighTreeNode( [],
                                             <string[]>this.inputs,
                                             Object.keys( this.planInputs )
                                           )
                   );
      }
    }

    /*----------------------------------------------------------------
     * Attempts to find node with same transition table; if it cannot,
     * then it creates a new one
     */
    private supplyNode( transitions: u.Dictionary<NodeT> ): NodeT {

      // Make signature
      var keys = Object.keys( transitions );
      keys.sort();
      var pieces: any = [];
      keys.forEach( function( k: string ) {
        pieces.push( k, transitions[k] );
      } );
      var transId = pieces.join( ',' );

      // Get node
      var node = this.transCache[transId];
      if (node) {
        return node;
      }
      else {
        return this.transCache[transId] = this.dfa.addNode( transitions );
      }
    }

    /*----------------------------------------------------------------
     * Build a single tree node for a high-order tree -- and,
     * recursively, all its children.
     */
    private buildHighTreeNode( encountered: string[],
                               remaining: string[],
                               candidates: string[]   ) {
      var transitions: u.Dictionary<NodeT> = {};

      // Check to see if we've visited a communatively-equivalent path
      var copy = encountered.slice( 0 );
      copy.sort();
      var nodeId = copy.join( ',' );
      var node = this.pathCache[nodeId];
      if (node) {
        return node;
      }

      var numTransitions = 0;

      // Try each remaining stay constraint
      for (var i = 0, l = remaining.length; i < l; ++i) {

        // debug output
        if (encountered.length == 1) {
          ++this.count;
          u.console.compile.error( this.count + '/' + this.max );
        }

        // We cycle through remaining inputs by shifting them off the front,
        //   then pushing them on the back when we're done
        var vid = remaining.shift();

        // Rule out candidates that output to this variable
        var reducedCandidates = candidates.filter( function( plan: string ) {
          return this.planInputs[plan].indexOf( vid ) != -1;
        }, this );

        // See what we got
        if (reducedCandidates.length == 1) {
          transitions[vid] = this.dfa.addLeaf( reducedCandidates[0] );
          ++numTransitions;
        }
        else if (reducedCandidates.length > 0 &&
                 reducedCandidates.length < candidates.length) {
          encountered.push( vid );
          transitions[vid] = this.buildHighTreeNode( encountered,
                                                     remaining,
                                                     reducedCandidates );
          encountered.pop();
          ++numTransitions;
        }

        // We're done - push on the back
        remaining.push( vid );
      }

      // Assertion: should always have at least one transition
      if (numTransitions == 0) {
        console.error( 'Building decision tree node with no transitions (we should have already found a solution by this point)' );
      }

      // Create node
      return this.pathCache[nodeId] = this.supplyNode( transitions );
    }

    /*----------------------------------------------------------------
     * Build a single tree node for a low-order tree -- and,
     * recursively, all its children.
     */
    private buildLowTreeNode( encountered: string[], remaining: string[] ) {
      var transitions: u.Dictionary<NodeT> = {};

      var numTransitions = 0;

      // Try each remaining stay contraint
      for (var i = 0, l = remaining.length; i < l; ++i) {

        // debug output
        if (encountered.length == 1) {
          ++this.count;
          u.console.compile.error( this.count + '/' + this.max );
        }

        // We cycle through remaining inputs by shifting them off the front,
        //   then pushing them on the back when we're done
        var vid = remaining.shift();

        // See if we can uniquely determine a plan from this information
        var plan = this.pickPlanFromLow( encountered, remaining );
        if (plan) {
          transitions[vid] = this.dfa.addLeaf( plan );
          ++numTransitions;
        }
        else {
          encountered.push( vid );
          transitions[vid] = this.buildLowTreeNode( encountered, remaining );
          encountered.pop();
          ++numTransitions;
        }

        // We're done - push on the back
        remaining.push( vid );
      }

      // Create node
      return this.supplyNode( transitions );
    }

    /*----------------------------------------------------------------
     * Determine whether the given variables uniquely determine a
     * plan.
     */
    private pickPlanFromLow( encountered: string[], remaining: string[] ): string {
      var candidates: string[] = [];

      // Only consider plans that don't write to any of the remaining variables
      for (var plan in this.planInputs) {
        if (u.arraySet.isSubset( remaining, this.planInputs[plan] )) {
          candidates.push( plan );
        }
      }

      // Go through encountered variables in reverse order and
      // rule out candidates that output to the variable
      var i = encountered.length - 1;
      while (i >= 0 && candidates.length > 1) {
        var newCandidates = candidates.filter( function( plan: string ) {
          return this.planInputs[plan].indexOf( encountered[i] ) != -1;
        }, this );
        if (newCandidates.length > 0) {
          candidates = newCandidates;
        }
        --i;
      }

      if (candidates.length == 1) {
        return candidates[0];
      }
      else {
        return null;
      }
    }

  }

}