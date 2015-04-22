module hd.system {

  import u = hd.utility;
  import g = hd.graph;
  import p = hd.plan;

  /*==================================================================
   * Perform topological sort of solution graph.
   * Sorts methods and variables separately.
   * Variables are subsorted on strength.
   */
  export function toposort( sgraph: g.SolutionGraph, planner: p.Planner ) {

    // Data structures to store the order calculated
    var mids: string[] = [];
    var vids: string[] = [];

    // Data structures to keep track of free nodes
    var freeMids: string[] = [];
    var freeVids = new u.Heap<string>( function( a: string, b: string ) {
      return planner.compare( g.stayConstraint( a ), g.stayConstraint( b ) ) > 0;
    } );

    // In-degree of all nodes
    var counts: u.Dictionary<number> = {};

    // Get initial in-degree for methods
    sgraph.methods().forEach( function( mid: string ) {
      var count = sgraph.inputsForMethod( mid ).length;
      counts[mid] = count;
      if (count == 0) {
        freeMids.push( mid );
      }
    } );

    // Get initial in-degree for variables
    sgraph.variables().forEach( function( vid: string ) {
      var count = sgraph.methodsWhichOutput( vid ).length;
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

      // Pick off any free methods
      while (freeMids.length > 0) {
        var mid = freeMids.pop();
        mids.push( mid );
        sgraph.outputsForMethod( mid ).forEach( reduceVid );
      }

      // Pick off just one free variable
      if (freeVids.length > 0) {
        var vid = freeVids.pop();
        vids.push( vid );
        sgraph.methodsWhichInput( vid ).forEach( reduceMid );
      }
    }

    return {vids: vids, mids: mids};
  }

}