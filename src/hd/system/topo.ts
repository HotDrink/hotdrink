module hd.system {

  import u = hd.utility;
  import g = hd.graph;
  import p = hd.plan;
  import m = hd.model;

  export
  function voidMethod(): string {
    return m.makeId( 'void' );
  }

  export
  function isVoidMethod( mid: string ): boolean {
    return mid.substring( 0, 5 ) === 'void#';
  }

  export
  function topograph( cgraph: g.ConstraintGraph,
                      sgraph: g.SolutionGraph    ): g.SolutionGraph {
    var tgraph = new g.CachingSolutionGraph;
    cgraph.variables().forEach( function( vid: string ) {
      tgraph.addVariable( vid );
    } );
    var cids = cgraph.constraints();
    for (var i = 0, l = cids.length; i < l; ++i) {
      var cid = cids[i];
      var mid = sgraph.selectedForConstraint( cid );
      if (mid) {
        tgraph.addMethod( mid,
                          cid,
                          cgraph.inputsForMethod( mid ),
                          cgraph.outputsForMethod( mid )
                        );
      }
      else {
        mid = m.makeId( "void" );
        tgraph.addMethod( mid,
                          cid,
                          cgraph.outputsForConstraint( cid ),
                          []
                        );
      }
    }
    return tgraph;
  }

  /*==================================================================
   * Perform topological sort of solution graph.
   * Sorts methods and variables separately.
   * Variables are subsorted on strength.
   */
  export
  function toposort( tgraph: g.SolutionGraph, planner: p.Planner ) {

    // Data structures to store the order calculated
    var mids: string[] = [];

    // Data structures to keep track of free nodes
    var freeVids: string[] = [];
    var freeMids = new u.Heap<string>( function( a: string, b: string ) {
      return planner.compare( tgraph.constraintForMethod( a ),
                              tgraph.constraintForMethod( b )  ) > 0;
    } );

    // In-degree of all nodes
    var counts: u.Dictionary<number> = {};

    // Get initial in-degree for methods
    tgraph.methods().forEach( function( mid: string ) {
      var count = tgraph.inputsForMethod( mid ).length;
      counts[mid] = count;
      if (count == 0) {
        freeMids.push( mid );
      }
    } );

    // Get initial in-degree for variables
    tgraph.variables().forEach( function( vid: string ) {
      var count = tgraph.methodsWhichOutput( vid ).length;
      counts[vid] = count;
      if (count == 0) {
        freeVids.push( vid );
      }
    } );

    // Reduce in-degree for method
    var reduceMid = function reduceMid( mid: string ) {
      if (--counts[mid] == 0) {
        freeMids.push( mid );
      }
    }

    // Reduce in-degree for variable
    var reduceVid = function reduceVid( vid: string ) {
      if (--counts[vid] == 0) {
        freeVids.push( vid );
      }
    };

    // Variables that are topologically unrelated should be sorted by strength

    // Repeat until graph is empty
    while (freeVids.length > 0 || freeMids.length > 0) {

      // Pick off any free variables
      while (freeVids.length > 0) {
        var vid = freeVids.pop();
        tgraph.methodsWhichInput( vid ).forEach( reduceMid );
      }

      // Pick off just one free method
      if (freeMids.length > 0) {
        var mid = freeMids.pop();
        mids.push( mid );
        tgraph.outputsForMethod( mid ).forEach( reduceVid );
      }
    }

    return mids;
  }

}
