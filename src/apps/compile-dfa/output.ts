
import u = hd.utility;
import g = hd.graph;
import d = hd.dfa;

/*==================================================================
 * Output DFA as JS code
 */
function outputDfa( dfa: d.SoftLinkedDfa,
                    compcgraph: g.ReadOnlyConstraintGraph,
                    cgraph: g.ReadOnlyConstraintGraph,
                    plandefs: u.Dictionary<u.ArraySet<string>>,
                    wstream: WritableStream                     ) {
  wstream.writeln( "pm = new hd.PropertyModel( hd.plan.DfaFnPlanner.bind( null," );

  var stayIndexes: u.Dictionary<number> = {};
  var count = 0;
  cgraph.variables().forEach( function( vid: string ) {
    stayIndexes[g.stayConstraint( vid )] = count++;
  } );

  wstream.writeln( "  /* Stay constraint numbering = */ {" );
  for (var stay in stayIndexes) {
    wstream.writeln( '    "' + stay + '" : ' + stayIndexes[stay] + ',' );
  }
  wstream.writeln( "  }," );

  wstream.writeln( "  /* Method numbering = */ [" );
  var methods = <string[]>cgraph.methods();
  methods.forEach( function( mid: string ) {
    wstream.writeln( '    "' + mid + '",' );
  } );
  wstream.writeln( "  ]," );

  wstream.writeln( "  /* DFA = */ function() {" );

  wstream.writeln( "" );
  wstream.writeln( "    var stays, i;" );
  wstream.writeln( "" );
  dfa.getNodes().forEach( function( id: string ) {
    wstream.writeln( "    var " + id + " = function " + id + "() {" );
    wstream.writeln( "      while (true) {" );
    if (dfa.order == d.Order.High) {
      wstream.writeln( "        switch (stays[i--]) {" );
    }
    else {
      wstream.writeln( "        switch (stays[i++]) {" );
    }

    var trans: u.Dictionary<string> = dfa.getTransitions( id );
    for (var input in trans) {
      if (trans[input] && trans[input] != id) {
        wstream.writeln( "          case " + stayIndexes[input] + ":" );
        var leaf = dfa.getLeafValue( trans[input] );
        if (leaf) {
          var mids = plandefs[leaf].map( function( mid: string ) {
            return methods.indexOf( mid );
          } );
          compcgraph.inputsForMethod( leaf ).forEach( function( vid: string ) {
            mids.push( methods.indexOf( g.stayMethod( vid ) ) );
          } );
          mids.sort( function(a: number, b:number) { return a - b; } );
          wstream.writeln( "            return [" + mids.join( ", " ) + "];" );
        }
        else {
          wstream.writeln( "            return " + trans[input] + ";" );
        }
        wstream.writeln( "            break;" );
      }
    }

    wstream.writeln( "        }" );
    wstream.writeln( "      }" );
    wstream.writeln( "    }" );
    wstream.writeln( "" );
  } );
  wstream.writeln( "    return function dfa( stayIds ) {" );
  wstream.writeln( "      stays = stayIds;" );
  if (dfa.order == d.Order.High) {
    wstream.writeln( "      i = stayIds.length - 1;" );
  }
  else {
    wstream.writeln( "      i = 0;" );
  }
  wstream.writeln( "      var f = " + dfa.getRoot() + ";" );
  wstream.writeln( "      do { f = f(); } while (typeof f === 'function');" );
  wstream.writeln( "      return f" );
  wstream.writeln( "    }" );
  wstream.writeln( "" );
  wstream.writeln( "  }()" );
  wstream.writeln( " ) );" );
}
