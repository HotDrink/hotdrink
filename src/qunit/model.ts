module hd.qunit {

  module( "hd.model" );

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;

  function id<T>( x: T ): T { return x };

  function checkSequence( vals: any[], poss: m.Position[] ) {
    var i = 0;
    return function( val: any, pos: m.Position ) {
      if (i >= vals.length || i >= poss.length) {
        ok( false, "Sequence too long" );
      }
      else {
        equal( val, vals[i], "Sequence value" );
        equal( pos, poss[i], "Sequence position" );
        ++i;
      }
    }
  }

  test( "paths", function() {
    expect( 21 );

    var spec = new m.ContextBuilder().references( "x, y, z" ).spec();

    var ctx: any = m.Context.construct( new m.Context(), spec );
    ctx.a = m.Context.construct( new m.Context(), spec );
    ctx.a.b = m.Context.construct( new m.Context(), spec );

    ctx.i = 8;
    var p1 = new m.Path( ctx, "i" );
    equal( p1.get( null ), ctx.i, "one field path" );

    ctx.a.j = 9;
    var p2 = new m.Path( ctx, "a.j" );
    equal( p2.get( null ), ctx.a.j, "two field path" );

    ctx.a.b.k = 10;
    var p3 = new m.Path( ctx, "a.b.k" );
    equal( p3.get( null ), ctx.a.b.k, "three field path" );

    ok( p1.constant && p2.constant && p3.constant, "constant paths" );

    var nr = new Result( E.next, null );
    var mr = new Result( E.next, "oops" );

    var vers = <any> [];

    ctx.x = ctx.a;
    var p4 = new m.Path( ctx, "x.j" );
    p4.addObserver( new ObservableTest( [nr, // rem
                                        ] ) );
    equal( p4.get( null ), ctx.a.j, "one reference path" );

    var o1 = (<any>p4).observers0[0];
    ok( 'destruct' in o1, "field observer" );

    var p5 = new m.Path( ctx, "x.y.k" );
    p5.addObserver( new ObservableTest( [nr, // set
                                         nr, // rem
                                        ] ) );

    var o2 = (<any>p5).observers0[0];
    ok( 'destruct' in o2, "field observer" );
    var o3 = (<any>p5).observers0[1];
    ok( 'destruct' in o3, "field observer" );

    ctx.a.y = ctx.a.b;
    equal( p5.get( null ), ctx.a.b.k, "two reference path" );

    var p6 = new m.Path( ctx, "x.k" );
    strictEqual( p6.get( null ), undefined, "dangling path" );

    ctx.x = ctx.a.b;
    equal( p6.get( null ), ctx.a.b.k, "shortcut path" );
    strictEqual( p5.get( null ), undefined, "dangling path" );
    strictEqual( p4.get( null ), undefined, "dangling path" );
    ok( o1.property['#observers'][0] === o1, "still watching" );
    ok( o2.property['#observers'][1] === o2, "still watching" );
    ok( o3.property['#observers'].length == 0, "done watching" );

    p6.forEach( checkSequence( [ctx.a.b.k], [null] ) );
    p5.forEach( checkSequence( [], [] ) );
  } );

  test( "array paths", function() {
    expect( 27 );

    var spec = new m.ContextBuilder().references( "x, y, z" ).spec();

    var ctx1: any = m.Context.construct( new m.Context(), spec );
    ctx1.x = new m.ArrayContext();
    ctx1.x.length = 10;

    var p1 = new m.Path( ctx1, "x[i]" );
    var o1 = (<any>p1).observers0[1];
    ok( o1.ctx === ctx1.x, "watching array" );
    ok( ctx1.x.changes['#observers'][0] === o1, "array being watched" );
    var t1 = new ObservableTest( [new Result( E.next, 2 ),
                                  new Result( E.next, 8 ),
                                  new Result( E.next, 5 ),
                                  new Result( E.next, 2 ),
                                  new Result( E.next, 2 ),
                                  new Result( E.next, 5 ),
                                  new Result( E.next, 4 )
                                 ] );
    p1.addObserver( t1 );
    ctx1.x[2] = 1;
    ctx1.x[8] = 2;
    ctx1.x[5] = 3;
    ctx1.x[2] = 6;
    ctx1.x[5] = undefined;
    ctx1.x[4] = 9;
    p1.removeObserver( t1 );

    p1.forEach( checkSequence( [6, 9, 2], [2, 4, 8] ) );

    ctx1.b = new m.ArrayContext();
    ctx1.b.length = [10];
    ctx1.b[4] = 10;
    ctx1.b[5] = 9;
    ctx1.b[9] = 8;

    var t2 = new ObservableTest( [new Result( E.next, 2 ),
                                  new Result( E.next, 4 ),
                                  new Result( E.next, 8 ),
                                  new Result( E.next, 4 ),
                                  new Result( E.next, 5 ),
                                  new Result( E.next, 9 )
                                 ] );
    p1.addObserver( t2 );

    ctx1.x = ctx1.b;
    p1.forEach( checkSequence( [10, 9, 8], [4, 5, 9] ) );

  } );

  test( "context builder", function() {
    expect( 11 );

    var context: any = new m.ContextBuilder()
          .variables( "x, y, z", {x: 3, z: 5} )
          .constraint( "c", "x, y" )
            .method( "x -> y", id )
            .method( "y -> x", id )
          .output( "x" )
          .touchDep( "z", "x" )
          .context();

    ok( context instanceof m.Context, "ContextBuilder creates a context" );

    var hd_data = context['#hd_data'];
    ok( hd_data, "Context has hd_data" );

    ok( hd_data.variables.length == 3,
        "ContextBuilder creates variables" );

    ok( context.x instanceof m.Variable &&
        context.y instanceof m.Variable &&
        context.z instanceof m.Variable,
        "ContextBuilder exposes variables" );

    strictEqual( context.x.optional, m.Optional.Max, "Variable is max-optional" );

    strictEqual( context.y.optional, m.Optional.Min, "Variable is min-optional" );

    ok( hd_data.constraints.length == 1 &&
        hd_data.constraints[0] instanceof m.Constraint,
        "ContextBuilder creates constraint" );

    var c = hd_data.constraints[0];
    ok( c.methods.length == 2 &&
        c.methods[0] instanceof m.Method &&
        c.methods[1] instanceof m.Method,
        "ContextBuilder creates methods" );

    ok( context.c,
        "ContextBuilder exposes constraint template" );

    ok( hd_data.outputs.length == 1 &&
        hd_data.outputs[0] instanceof m.Output &&
        hd_data.outputs[0].variable == "x",
        "ContextBuilder creates output" );

    ok( hd_data.touchDeps.length == 1 &&
        hd_data.touchDeps[0] instanceof m.TouchDep &&
        hd_data.touchDeps[0].from == "z" &&
        hd_data.touchDeps[0].to == "x",
        "ContextBuilder creates touch dependency" );

  } );

  test( "references", function() {
    var ctx: any = new m.ContextBuilder()
          .variables( "x, y" )
          .references( "r, s, t" )
          .constraint( "c", "s, x" )
            .method( "s -> x", id )
            .method( "x -> s", id )
          .output( "t" )
          .touchDep( "y", "t" )
          .context();

    ok( ctx.$r instanceof r.BasicSignal, "ContextBuilder creates reference" );

    ctx.$r.addObserver( new ObservableTest(
      [new Result( E.next, 3 ),
       new Result( E.next, 7 )]
    ) );
    ctx.r = 3;
    ctx.r = 7;

    ok( ctx.c,
        "Constraint with references gets a template" );

    equal( m.Context.constraints( ctx ).length, 0,
           "Constraint with references not instantiated" )

    var x = m.Context.update( ctx );

    ok( x.removes.length == 0 && x.adds.length == 0,
        "No updates with undefined reference" );

    ctx.s = ctx.y;

    x = m.Context.update( ctx );

    ok( x.removes.length == 0 && x.adds.length == 1,
        "One update" );

    ok( x.adds[0] instanceof m.Constraint,
        "Update is a constraint" );

    var c = <m.Constraint>x.adds[0];

    equal( c.variables.length, 2,
           "Constraint has correct number of variables" );

    ok( c.variables[0] === ctx.y &&
        c.variables[1] === ctx.x,
        "Constraint uses correct variables" );

    ok( c.methods.length == 2 &&
        c.methods[0] instanceof m.Method &&
        c.methods[1] instanceof m.Method,
        "Constraint has correct number of methods" );

    ok( c.methods[0].inputs.length == 1 &&
        c.methods[0].inputs[0] === ctx.y &&
        c.methods[0].outputs.length == 1 &&
        c.methods[0].outputs[0] === ctx.x,
        "Method 1 looks good" );

    ok( c.methods[1].inputs.length == 1 &&
        c.methods[1].inputs[0] === ctx.x &&
        c.methods[1].outputs.length == 1 &&
        c.methods[1].outputs[0] === ctx.y,
        "Method 2 looks good" );

    ok( m.Context.constraints( ctx ).length == 1 && c === m.Context.constraints( ctx )[0],
        "Constraint stored in context" );

    ctx.s = 7;

    x = m.Context.update( ctx );

    ok( x.removes.length == 1 && x.adds.length == 1,
        "Two updates" );

    ok( x.removes[0] === c, "Remove old constraint" );

    ok( x.adds[0] instanceof m.Constraint, "Add new constraint" );

    c = <m.Constraint>x.adds[0];

    equal( c.variables.length, 1, "Constraint has correct number of variables" );

    ok( c.variables[0] === ctx.x, "Constraint uses correct variable" );

    ok( c.methods.length == 1 && c.methods[0] instanceof m.Method,
        "Constraint has correct number of methods" );

    ok( c.methods[0].inputs.length == 1 &&
        c.methods[0].inputs[0] === 7 &&
        c.methods[0].outputs.length == 1 &&
        c.methods[0].outputs[0] === ctx.x,
        "Method 1 looks good" );

    ok( m.Context.constraints( ctx ).length == 1 && c === m.Context.constraints( ctx )[0],
        "Constraint stored in context" );

    ctx.s = undefined;

    x = m.Context.update( ctx );

    ok( x.removes.length == 1 && x.adds.length == 0, "One update" );

    ok( x.removes[0] === c, "Remove old constraint" );

    ok( m.Context.constraints( ctx ).length == 0,
        "No constraints in context" );

    equal( m.Context.outputs( ctx ).length, 0, "Context has no outputs" );

    equal( m.Context.touchDeps( ctx ).length, 0, "Context has no touch dependencies" );

    ctx.t = ctx.x;

    x = m.Context.update( ctx );

    ok( x.removes.length == 0 && x.adds.length == 2, "Two updates" );

    ok( x.adds[0] instanceof m.TouchDep &&
        (<m.TouchDep>x.adds[0]).from === ctx.y &&
        (<m.TouchDep>x.adds[0]).to === ctx.x,
        "Correct touch dependency" );

    ok( x.adds[1] instanceof m.Output &&
        (<m.Output>x.adds[1]).variable === ctx.x,
        "Correct output" );

    var o = x.adds[0];
    var t = x.adds[1];

    ctx.t = ctx.y;

    x = m.Context.update( ctx );

    ok( x.removes.length == 2 && x.adds.length == 1, "Three updates" );

    ok( x.removes[1] === t && x.removes[0] == o,
        "Remove old elements" );

    ok( x.adds[0] instanceof m.Output &&
        (<m.Output>x.adds[0]).variable === ctx.y,
        "Correct output" );

    o = x.adds[0];

    ctx.t = undefined;

    x = m.Context.update( ctx );

    ok( x.removes.length == 1 && x.adds.length == 0, "One update" );

    ok( x.removes[0] === o, "Remove old output" );

  } );


  test( "optional syntax", function() {
    var ctx: any = new m.ContextBuilder()
          .variables( "x, y, z", {x: 4} )
          .constraint( "x => x, y" )
            .method( "x -> y", id )
          .constraint( "x, y => y, z" )
            .method( "y -> z", id )
          .context();
    m.Context.update( ctx );

    equal( m.Context.constraints( ctx ).length, 2,
           "Created two constraints" );

    var c = m.Context.constraints( ctx )[0];
    ok( c instanceof m.Constraint &&
        c.variables.length == 2 &&
        c.variables[0] === ctx.x &&
        c.variables[1] === ctx.y,
        "Constraint looks ok" );

    equal( c.optional, m.Optional.Max,
           "Constraint is optional" );

    equal( c.touchVariables.length, 1,
           "Constraint has touch variables" );

    c = m.Context.constraints( ctx )[1];
    ok( c instanceof m.Constraint &&
        c.variables.length == 2 &&
        c.variables[0] === ctx.y &&
        c.variables[1] === ctx.z,
        "Constraint looks ok" );

    equal( c.optional, m.Optional.Max,
           "Constraint is optional" );

    equal( c.touchVariables.length, 2,
           "Constraint has touch variables" );

    ctx = new m.ContextBuilder()
          .variables( "x, y, z", {x: 3, y: 4, z: 5} )
          .references( "a, b, c" )
          .constraint(  "a, b => b, c" )
            .method( "b -> c", id )
          .context();
    m.Context.update( ctx );

    equal( m.Context.constraints( ctx ).length, 0, "No constraints" );
    equal( m.Context.touchDeps( ctx ).length, 0, "No touch dependencies" );

    ctx.b = ctx.y;
    var x = m.Context.update( ctx );
    ok( x.removes.length == 0 && x.adds.length == 0,
        "No updates with half-defined constraint" )

    ctx.c = ctx.z;
    var x = m.Context.update( ctx );
    ok( x.removes.length == 0 && x.adds.length == 1,
        "One updates" );

    ok( x.adds[0] instanceof m.Constraint, "Update is constraint" );

    var c = <m.Constraint>x.adds[0];
    ok( c.variables.length == 2 &&
        c.variables[0] === ctx.y &&
        c.variables[1] === ctx.z,
        "Constraint uses correct variables" );

    equal( c.optional, m.Optional.Max,
           "Constraint is optional" );

    equal( c.touchVariables.length, 1,
           "Constraint touch variable" );

    ok( c.touchVariables[0] == ctx.y,
        "Correct touch variable" );

    ctx.c = undefined;
    x = m.Context.update( ctx );
    ok( x.removes.length == 1 && x.adds.length == 0, "One update" );
    ok( x.removes[0] === c,  "Remove constraint" );

  } );

  test( "array contexts", function() {
    expect( 12 );

    var a = new m.ArrayContext();
    a.length = 10;
    a.changes.addObserver( new ObservableTest(
      [new Result( E.next, 3 ),
       new Result( E.next, 8 ),
       new Result( E.next, 4 ),
       new Result( E.next, 10 ),
       new Result( E.next, 3 ),
       new Result( E.next, 8 ),
       new Result( E.next, 12 ),
       new Result( E.next, 12 ),
       new Result( E.next, 10 ),
       new Result( E.next, 8 )
      ]
    ) );

    a[3] = 6;
    a[8] = 12;
    a[4] = 4;
    a.push( -3 );
    a[3] = 8;
    a[8] = 12;

    a.length = 13;
    equal( a.length, 13, "Set length" );

    a[12] = 4;

    a.length = 8;
    equal( a.length, 8, "Set length 2" );

  } );
}
