/*####################################################################
 * The ConstraintGraph interface and classes.
 *
 * A constraint graph is simply a wrapper around a directed graph.  It
 * provides a more controlled way to build up the graph, as well as
 * methods which perform the standard queries you'd expect to perform.
 * Wrapping the graph also provides the opportunity to provide caching
 * for common queries if desired.
 *
 * A constraint graph may be viewed as a hypergraph, in which the
 * variables are nodes and the methods are hyperedges going from the
 * input variables to the output variables.  Thus, the "addVariable"
 * function adds a node to the graph, and the "addMethod" function
 * adds a hyperedge to the graph.
 */
module hd.graph {

  import u = hd.utility;
  import r = hd.reactive;

  /*==================================================================
   * The read-only interface describes the queries you can perform on
   * a constraint graph.
   *
   * Note that this is not intended to be a /constant/ constraint
   * graph; it is the /interface/ that does not support editing, not
   * the underlying type.  The interface is meant to document/enforce
   * the intention that certain code should not modify the graph.
   */

  export interface ReadOnlyConstraintGraph {

    // A walker performs a depth-first traversal of the graph
    graph: Digraph<string>;

    // Queries for the different elements of the graph
    variables(): u.ArraySet<string>;
    methods(): u.ArraySet<string>;
    constraints(): u.ArraySet<string>;
    contains( id: string ): boolean;

    // Queries for variables
    variablesForMethod( mid: string ): u.ArraySet<string>;
    inputsForMethod( mid: string ): u.ArraySet<string>;
    outputsForMethod( mid: string ): u.ArraySet<string>;
    variablesForConstraint( cid: string ): u.ArraySet<string>;
    inputsForConstraint( cid: string ): u.ArraySet<string>;
    outputsForConstraint( cid: string ): u.ArraySet<string>;

    // Queries for methods
    methodsWhichInput( vid: string ): u.ArraySet<string>;
    methodsWhichOutput( vid: string ): u.ArraySet<string>;
    methodsWhichUse( vid: string ): u.ArraySet<string>;
    methodsForConstraint( cid: string ): u.ArraySet<string>;

    // Queries for constraints
    constraintsWhichInput( vid: string ): u.ArraySet<string>;
    constraintsWhichOutput( vid: string ): u.ArraySet<string>;
    constraintsWhichUse( vid: string ): u.ArraySet<string>;
    constraintForMethod( mid: string ): string;

  }

  /*==================================================================
   * The full constraint graph interface simply adds on methods to
   * facilitate adding nodes/edges to the graph.  It also issues
   * events when it is changed, allowing observers to respond to the
   * changes.
   */
  export interface ConstraintGraph extends ReadOnlyConstraintGraph {

    // Add nodes to the graph
    addVariable( vid: string ): void;
    addMethod( mid: string,
               cid: string,
               inputs: u.ArraySet<string>,
               outputs: u.ArraySet<string> ): void;

    // Remove nodes; edges which use the nodes are removed automatically
    removeVariable( vid: string ): void;
    removeMethod( mid: string ): void;
  }

  /*------------------------------------------------------------------
   * Used for type parameters.
   */
  export interface ConstraintGraphType {
    new(): ConstraintGraph;
  }

  /*==================================================================
   * This implementation of ConstraintGraph does not do any caching.
   * All information is stored in the graph (constraint ids are
   * stored as labels for method nodes).  Queries are recaclulated
   * every time directly from the graph.
   */
  export class NoCachingConstraintGraph {

    // The directed graph
    graph: Digraph<string> = new Digraph<string>();

    /*----------------------------------------------------------------
     * Given a list of methods, return a set of the corresponding
     * constraints.
     */
    private constraintsFor( mids: u.ArraySet<string> ): u.ArraySet<string> {
      var cids: u.Dictionary<boolean> = {};
      mids.forEach( function( mid: string ) {
        cids[this.graph.getLabel( mid )] = true;
      }, this );
      return Object.keys( cids );
    }

    /*----------------------------------------------------------------
     * Add variable node to the graph.
     */
    addVariable( vid: string ) {
      this.graph.addNode( vid );
    }

    /*----------------------------------------------------------------
     * Add method node to the graph.
     * Also add edges which use this new node at the same time.
     * Precondition: all inputs/outputs have already been added to the graph
     */
    addMethod( mid: string,
               cid: string,
               inputs: u.ArraySet<string>,
               outputs: u.ArraySet<string> ) {
      this.graph.addNode( mid, cid );
      inputs.forEach( this.graph.addEdgeTo( mid ) );
      outputs.forEach( this.graph.addEdgeFrom( mid ) );
    }

    /*----------------------------------------------------------------
     * Remove specified variable (and all edges which use that node).
     * Precondition: any methods which use this as input/output have
     * already been removed from the graph
     */
    removeVariable( vid: string ) {
      this.graph.removeNode( vid );
    }

    /*----------------------------------------------------------------
     * Remove specified method (and all edges which use that node).
     */
    removeMethod( mid: string ) {
      var cid = this.constraintForMethod( mid );
      this.graph.removeNode( mid );
    }

    /*----------------------------------------------------------------
     * All variables contained in the constraint graph.
     */
    variables(): u.ArraySet<string> {
      return this.graph.getUnlabeledNodes();
    }

    /*----------------------------------------------------------------
     * All methods contained in the constraint graph.
     */
    methods(): u.ArraySet<string> {
      return this.graph.getLabeledNodes();
    }

    /*----------------------------------------------------------------
     * All constraints contained in the constraint graph.
     */
    constraints(): u.ArraySet<string> {
      return this.constraintsFor( this.graph.getLabeledNodes() );
    }

    /*----------------------------------------------------------------
     */
    contains( id: string ): boolean {
      return this.graph.hasNode( id );
    }

    /*----------------------------------------------------------------
     * All methods which use specified variable as input.
     */
    methodsWhichInput( vid: string ): u.ArraySet<string> {
      return this.graph.getOutsFor( vid );
    }

    /*----------------------------------------------------------------
     * All methods which use specified variable as output.
     */
    methodsWhichOutput( vid: string ): u.ArraySet<string> {
      return this.graph.getInsFor( vid );
    }

    /*----------------------------------------------------------------
     * All methods which use specified variable (whether input or
     * ouptut)
     */
    methodsWhichUse( vid: string ): u.ArraySet<string> {
      var ins = this.graph.getInsFor( vid );
      var outs = this.graph.getOutsFor( vid );
      return u.arraySet.union( ins, outs );
    }

    /*----------------------------------------------------------------
     * All constraints which have a method using the specified
     * variable as input.
     */
    constraintsWhichInput( vid: string ): u.ArraySet<string> {
      return this.constraintsFor( this.methodsWhichInput( vid ) );
    }

    /*----------------------------------------------------------------
     * All constraints which have a method using the specified
     * variable as output.
     */
    constraintsWhichOutput( vid: string ): u.ArraySet<string> {
      return this.constraintsFor( this.methodsWhichOutput( vid ) );
    }

    /*----------------------------------------------------------------
     * All constraints which use the specified variable.
     */
    constraintsWhichUse( vid: string ): u.ArraySet<string> {
      return this.constraintsFor( this.methodsWhichUse( vid ) );
    }

    /*----------------------------------------------------------------
     * The variables used as input for the specified method.
     */
    inputsForMethod( mid: string ): u.ArraySet<string> {
      return this.graph.getInsFor( mid );
    }

    /*----------------------------------------------------------------
     * The variables used as output for the specified method.
     */
    outputsForMethod( mid: string ): u.ArraySet<string> {
      return this.graph.getOutsFor( mid );
    }

    /*----------------------------------------------------------------
     * The variables used as either input or output for the specified
     * method.
     */
    variablesForMethod( mid: string ): u.ArraySet<string> {
      var ins = this.graph.getInsFor( mid );
      var outs = this.graph.getOutsFor( mid );
      return u.arraySet.union( ins, outs );
    }

    /*----------------------------------------------------------------
     * The constraint which specified method belongs to.
     */
    constraintForMethod( mid: string ): string {
      return this.graph.getLabel( mid );
    }

    /*----------------------------------------------------------------
     * The variables used as input for at least one method in the
     * specified constraint.
     */
    inputsForConstraint( cid: string ): u.ArraySet<string> {
      var mids = this.methodsForConstraint( cid );
      var inputsList = mids.map( this.graph.getInsFor, this.graph );
      return inputsList.reduce<u.ArraySet<string>>( u.arraySet.union, [] );
    }

    /*----------------------------------------------------------------
     * The variables used as output for at least one method in the
     * specified constraint.
     */
    outputsForConstraint( cid: string ): u.ArraySet<string> {
      var mids = this.methodsForConstraint( cid );
      var outputsList = mids.map( this.graph.getOutsFor, this.graph );
      return outputsList.reduce<u.ArraySet<string>>( u.arraySet.union, [] );
    }

    /*----------------------------------------------------------------
     * The variables used by specified constraint.
     */
    variablesForConstraint( cid: string ): u.ArraySet<string> {
      var mids = this.methodsForConstraint( cid );
      var inputsList = mids.map( this.graph.getInsFor, this.graph );
      var outputsList = mids.map( this.graph.getOutsFor, this.graph );
      var inputs = inputsList.reduce<u.ArraySet<string>>( u.arraySet.union, [] );
      var outputs = outputsList.reduce<u.ArraySet<string>>( u.arraySet.union, [] );
      return u.arraySet.union( inputs, outputs );
    }

    /*----------------------------------------------------------------
     * The methods belonging to the specified constraint.
     */
    methodsForConstraint( cid: string ): u.ArraySet<string> {
      return this.methods().filter( function( mid: string ) {
        return this.graph.getLabel( mid ) == cid;
      }, this );
    }

  }

  /*==================================================================
   * This implementation of ConstraintGraph expands on the simple
   * NoCachingConstraintGraph by keeping a set of all variable ids and
   * a map from constraint id to the methods in the constraint.
   * This speeds up the slowest queries from NoCachingConstraintGraph.
   */
  export class CachingConstraintGraph extends NoCachingConstraintGraph {

    // Keeps ids of all variables
    private vids: u.StringSet = {};

    // Maps constraint ids to methods in the constraint
    private cids: u.Dictionary<u.ArraySet<string>> = {};

    /*----------------------------------------------------------------
     * Add variable / update cache
     */
    addVariable( vid: string ) {
      super.addVariable( vid );
      this.vids[vid] = true;
    }

    /*----------------------------------------------------------------
     * Add method / update cache
     */
    addMethod( mid: string,
               cid: string,
               ins: u.ArraySet<string>,
               outs: u.ArraySet<string> ) {
      super.addMethod( mid, cid, ins, outs );
      if (cid in this.cids) {
        u.arraySet.add( this.cids[cid], mid );
      }
      else {
        this.cids[cid] = [mid];
      }
    }

    /*----------------------------------------------------------------
     * Remove variable / update cache
     */
    removeVariable( vid: string ) {
      delete this.vids[vid];
      super.removeVariable( vid );
    }

    /*----------------------------------------------------------------
     * Remove method / update cache
     */
    removeMethod( mid: string ) {
      var cid = this.graph.getLabel( mid );
      var allmids = this.cids[cid];
      u.arraySet.remove( allmids, mid );
      if (allmids.length == 0) {
        delete this.cids[cid];
      }
      super.removeMethod( mid );
    }

    /*----------------------------------------------------------------
     * Get variables from cache
     */
    variables(): u.ArraySet<string> {
      return Object.keys( this.vids );
    }

    /*----------------------------------------------------------------
     * Get constraints from cache
     */
    constraints(): u.ArraySet<string> {
      return Object.keys( this.cids );
    }

    /*----------------------------------------------------------------
     * Look up method from cache
     */
    methodsForConstraint( cid: string ): u.ArraySet<string> {
      var mids = this.cids[cid];
      return mids ? u.arraySet.clone( mids ) : [];
    }
  }

}