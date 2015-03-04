/*####################################################################
 */

import p = hd.plan;

var fs = require( 'fs' );

hd.utility.enableConsole( 'compile' );

// Debug ids needs to match what it will be in execution
//hd.model.debugIds = false;

var order: d.Order;
var infiles = process.argv.slice( 2 ).filter( function( arg: string ) {
  if (arg == '--high') {
    order = d.Order.High;
    return false;
  }
  if (arg == '--low') {
    order = d.Order.Low;
    return false;
  }
  return true;
} );

nextCompile();

function nextCompile() {

  if (infiles.length == 0) return;

  var infile = infiles.shift();
  console.error( 'Compiling ' + infile );
  var intext = fs.readFileSync( infile, 'utf8' )

  var model: hd.model.Modelcule;
  eval( intext );

  var system = new hd.ConstraintSystem;
  system.updateOnModelChange = hd.system.Update.None;
  system.addComponent( model );

  var cgraph = system.getCGraph();
  var composite = d.composeAllConstraints( cgraph );
  var compcgraph = d.makeConstraintGraph( cgraph, composite );
  var compmids = Object.keys( composite.compmids );

  console.error( 'Combined to single constraint with ' +
                 compmids.length + ' methods'
               );

  var ins = 0;
  var outs = 0;
  for (var i = 0, l = compmids.length; i < l; ++i) {
    ins+= compcgraph.inputsForMethod( compmids[i] ).length;
    outs+= compcgraph.outputsForMethod( compmids[i] ).length;
  }
  console.error( 'Average number of inputs =  ' + (ins / compmids.length) );
  console.error( 'Average number of outputs = ' + (outs / compmids.length) );

  if (! order) {
    order = (ins < outs ? d.Order.High : d.Order.Low);
  }
  if (order == d.Order.High) {
    console.error( 'Compiling high-order DFA' );
  }
  else {
    console.error( 'Compiling low-order DFA' );
  }

  var dfa = new d.SoftLinkedDfa();
  d.compileToDfa( dfa, compcgraph, order );
  console.error( 'Compiled to DFA with ' + dfa.getNodes().length +
                 ' nodes.'
               );

  var outfile = infile.replace( /\.js$/, '.c.js' );
  if (outfile == infile) {
    outfile+= '.c';
  }

  var wstream = fs.createWriteStream( outfile );
  wstream.writeln = function( data: string ) { this.write( data ); this.write( '\n' ); }
  outputDfa( dfa, compcgraph, cgraph, composite.compmids, wstream );
  wstream.writeln( intext );
  wstream.end( nextCompile );

}