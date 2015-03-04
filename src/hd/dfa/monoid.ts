module hd.dfa {

  import u = hd.utility;
  import g = hd.graph;
  import m = hd.model;

  /*==================================================================
   * A record for a single composite-constraint.
   * Records what constraints it combines, and defines methods in
   * terms of combinations of primitive methods.
   */
  export class CompositeConstraint {

    // Unique id for the constraint
    id: string;

    // List of all constraints combined in this composite-constraint
    cids: u.ArraySet<string>;

    // Mapping from composite-method id to ids of primitive methods that compose it
    compmids: u.Dictionary<u.ArraySet<string>> = {};

    /*----------------------------------------------------------------
     * Constructor
     * Creates a costraint composed from specified primitive
     * constraints.  The constraint is created empty (no methods).
     */
    constructor( cids: u.ArraySet<string> ) {
      this.cids = <string[]>cids;
      this.id = newCompositeConstraintId( this.cids );
    }

    /*----------------------------------------------------------------
     * Factory method: creates a constraint composed of only a single
     * primitive constraint
     */
    static fromPrimitive( cgraph: g.ReadOnlyConstraintGraph, cid: string ) {
      var cmpc = new CompositeConstraint( [cid] );
      cgraph.methodsForConstraint( cid ).forEach( cmpc.addMethod, cmpc );
      return cmpc;
    }


    /*----------------------------------------------------------------
     * Get the ids of all composite-methods in this constraint
     */
    getMethodIds() : u.ArraySet<string> {
      return Object.keys( this.compmids );
    }

    /*----------------------------------------------------------------
     * Given a compoiste-method id, return the primitive method ids
     * that compose it.
     */
    getPrimitiveIdsForMethod( mid: string ) {
      return this.compmids[mid];
    }

    /*----------------------------------------------------------------
     * Add a new composite-method to the constraint consisting of the
     * specified primitive method/methods.
     */
    addMethod( mid: string ): void;
    addMethod( mids: u.ArraySet<string> ): void;
    addMethod( mids: any ) {
      if (! Array.isArray( mids )) {
        mids = [mids];
      }
      var mmid = newCompositeMethodId( mids );
      this.compmids[mmid] = mids;
    }
  }

  /*==================================================================
   */
  export function addCompositeMethods( compcgraph: g.ConstraintGraph,
                                       fullcgraph: g.ReadOnlyConstraintGraph,
                                       composite: CompositeConstraint         ) {
    var vids: u.StringSet = {};
    compcgraph.variables().forEach( function( vid: string ) {
      u.stringSet.add( vids, vid );
    } );


    for (var compmid in composite.compmids) {
      var mids = composite.compmids[compmid];
      var outs: u.StringSet = {};
      for (var i = 0, l = mids.length; i < l; ++i) {
        var mid = mids[i];
        outs = fullcgraph.outputsForMethod( mid ).reduce( u.stringSet.build, outs );
      }
      var ins = u.stringSet.difference( vids, outs );
      compcgraph.addMethod( compmid,
                            composite.id,
                            u.stringSet.members( ins ),
                            u.stringSet.members( outs )
                          );
    }
  }

  /*==================================================================
   */
  export function makeConstraintGraph( cgraph: g.ReadOnlyConstraintGraph,
                                       composite: CompositeConstraint
                                     ): g.ConstraintGraph                 {
    var compcgraph = new g.CachingConstraintGraph();

    cgraph.variables().forEach( compcgraph.addVariable, compcgraph );

    addCompositeMethods( compcgraph, cgraph, composite );

    return compcgraph;
  }

  /*==================================================================
   */
  export function composeAllConstraints( cgraph: g.ReadOnlyConstraintGraph
                                       ) {
    var composites = <CompositeConstraint[]>cgraph.constraints()
          .filter( g.isNotStayConstraint )
          .map( CompositeConstraint.fromPrimitive.bind( null, cgraph ) );

    while (composites.length > 1) {
      var newcomposites: CompositeConstraint[] = [];
      for (var i = 0, l = composites.length; i < l; i+= 2) {
        if (i + 1 < l) {
          newcomposites.push(
            addConstraints( composites[i], composites[i + 1], cgraph )
          );
        }
        else {
          newcomposites.push( composites[i] );
        }
      }
      composites = newcomposites;
    }

    return composites[0];
  }

  /*==================================================================
   * Take two composite-constraints and combine them, creating a new
   * composite constraint containing every valid combination of the
   * original methods.
   */
  function addConstraints( compA: CompositeConstraint,
                           compB: CompositeConstraint,
                           cgraph: g.ReadOnlyConstraintGraph
                         ): CompositeConstraint              {
    // Calculate all the individual constraints going into this multi-constraint
    var allcids = u.arraySet.unionKnownDisjoint( compA.cids, compB.cids );
    var compC = new CompositeConstraint( allcids );

    var compmidsA = compA.getMethodIds();
    var compmidsB = compB.getMethodIds();

    // Every combination of method from A with method from B
    for (var a = compmidsA.length - 1; a >= 0; --a) {
      var compmidA = compmidsA[a];

      for (var b = compmidsB.length - 1; b >= 0; --b) {
        var compmidB = compmidsB[b];

        // Calculate all the individual methods which would be combined
        var allmids = u.arraySet.unionKnownDisjoint(
          compA.getPrimitiveIdsForMethod( compmidA ),
          compB.getPrimitiveIdsForMethod( compmidB )
        );

        // Make a graph of all the methods
        var mgraph = new g.Digraph<string>();
        cgraph.variables().forEach( <(n: string) => void>mgraph.addNode, mgraph );
        allmids.forEach( function( mid: string ) {
          var inputs = cgraph.inputsForMethod( mid );
          var outputs = cgraph.outputsForMethod( mid );

          mgraph.addNode( mid );
          inputs.forEach( mgraph.addEdgeTo( mid ) );
          outputs.forEach( mgraph.addEdgeFrom( mid ) );
        } );

        // Check the graph to see if this is valid combination
        if (isValidCompositeMethod( mgraph,
                                    allmids.reduce( u.stringSet.build,
                                                    <u.StringSet>{}
                                                  )
                                  )                                 ) {
          compC.addMethod( allmids );
        }
      }
    }

    return compC;
  }

  /*==================================================================
   * Test a graph to make sure it is a valid multi-method.
   * - no two methods with the same output
   * - no cycles
   */
  function isValidCompositeMethod( mgraph: g.Digraph<string>, mids: u.StringSet ) {
    var indegree: u.Dictionary<number> = {};
    var sources: string[] = [];
    var nodes = mgraph.getNodes();

    // Note: To test for cycles we basically do a topological sort of
    //       the nodes in the graph without remembering the result; we
    //       only care whether it worked or not.
    //
    //       Rather than actually removing nodes from the graph, we
    //       keep separate counters of how many edges are going into
    //       each node.

    // Initialize the counter for each node
    // Nodes with a count of zero are added to the sources list
    // If any variables have a count > 1, the graph is invalid
    //   (means more than one method is writing to the variable)
    var methodOutputConflict = false;
    nodes.forEach( function( id: string ) {
      var count = mgraph.getInsFor( id ).length;
      indegree[id] = count;
      if (count == 0) {
        sources.push( id );
      }
      else if (count > 1 && ! mids[id]) {
        methodOutputConflict = true;
      }
    } );

    if (methodOutputConflict) { return false; }

    // We "remove" source nodes by decrementing the counters of each
    // of its output variables
    var removeInput = function removeInput( nodeId: string ) {
      if (--indegree[nodeId] == 0) {
        sources.push( nodeId );
      }
    };

    var numvisited = 0;
    while (sources.length > 0) {
      var id = sources.pop();
      ++numvisited;
      mgraph.getOutsFor( id ).forEach( removeInput );
    }

    // If we visited every node, then we have a topological ordering
    return (numvisited == nodes.length);
  }

  /*==================================================================
   */
  var ids = new m.IdGenerator();

  /*==================================================================
   * Create a unique descriptive id for a multi-constraint
   */
  function newCompositeConstraintId( cids: u.ArraySet<string> ) {
    var name = 'composite';

    if (m.debugIds) {
      var idparts: string[] = [];
      cids.forEach( function( cid: string ) {
        if (idparts.length != 0) {
          idparts.push( ' + ' );
        }
        idparts.push( '(', cid.substring( 0, cid.indexOf( '#' ) ), ')' );
      } );
      name = idparts.join( '' );
    }

    return ids.makeId( name );
  }

  /*==================================================================
   * Create a unique descriptive id for a multi-method
   */
  function newCompositeMethodId( mids: u.ArraySet<string> ) {
    var name = 'composite';

    if (m.debugIds) {
      var idparts: string[] = [];
      mids.forEach( function( mid: string ) {
        if (idparts.length != 0) {
          idparts.push( ' + ' );
        }
        idparts.push( '(', mid.substring( 0, mid.indexOf( '#' ) ), ')' );
      } );
      name = idparts.join( '' );
    }

    return ids.makeId( name );
  }

}