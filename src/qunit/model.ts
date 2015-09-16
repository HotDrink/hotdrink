module hd.qunit {

  module( "hd.model" );

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;

  function id<T>( x: T ): T { return x };

  function checkSequence( paths: m.Path[], poss: m.Position[] ) {
    var i = 0;
    var pos = m.Path.beginAll( paths );
    while (pos != null) {
      deepEqual( pos, poss[i], "Path list has expected position" );
      i++;
      pos = m.Path.nextAll( paths, pos );
    }
    if (i < poss.length) {
      ok( false, "Expected more positions for path list" );
    }
  }

  test( "paths", function() {
    expect( 20 );

    var spec = new m.ContextBuilder().references( "x, y, z" ).spec();

    var ctx: any = m.Context.construct( new m.Context(), spec );
    ctx.a = m.Context.construct( new m.Context(), spec );
    ctx.a.b = m.Context.construct( new m.Context(), spec );

    ctx.i = 8;
    var p1 = new m.Path( ctx, "i" );
    equal( p1.get(), ctx.i, "one field path" );

    ctx.a.j = 9;
    var p2 = new m.Path( ctx, "a.j" );
    equal( p2.get(), ctx.a.j, "two field path" );

    ctx.a.b.k = 10;
    var p3 = new m.Path( ctx, "a.b.k" );
    equal( p3.get(), ctx.a.b.k, "three field path" );

    ok( p1.isConstant() && p2.isConstant() && p3.isConstant(), "constant paths" );

    var nr = new Result( E.next, {} );
    var mr = new Result( E.next, "oops" );

    var vers = <any> [];

    ctx.x = ctx.a;
    var p4 = new m.Path( ctx, "x.j" );
    p4.addObserver( new ObservableTest( [nr, // rem
                                        ] ) );
    equal( p4.get(), ctx.a.j, "one reference path" );

    var o1 = <m.PropertyObserver>(<any>p4).rootObserver;
    ok( o1 instanceof m.PropertyObserver, "field observer" );

    var p5 = new m.Path( ctx, "x.y.k" );
    p5.addObserver( new ObservableTest( [nr, // set
                                         nr, // rem
                                        ] ) );

    var o2 = <m.PropertyObserver>(<any>p5).rootObserver;
    ok( o2 instanceof m.PropertyObserver, "field observer" );
    var o3 = <m.PropertyObserver>o2.child;
    ok( o2 instanceof m.PropertyObserver, "field observer" );

    ctx.a.y = ctx.a.b;
    equal( p5.get(), ctx.a.b.k, "two reference path" );

    var p6 = new m.Path( ctx, "x.k" );
    strictEqual( p6.get(), undefined, "dangling path" );

    ctx.x = ctx.a.b;
    equal( p6.get(), ctx.a.b.k, "shortcut path" );
    strictEqual( p5.get(), undefined, "dangling path" );
    strictEqual( p4.get(), undefined, "dangling path" );
    ok( (<any>o1.property)['#observers'][0] === o1, "still watching" );
    ok( (<any>o2.property)['#observers'][1] === o2, "still watching" );
    ok( (<any>o3.property)['#observers'].length == 0, "done watching" );

    checkSequence( [p6], [{}] );
    checkSequence( [p4], [] );
  } );

  test( "array paths", function() {
    expect( 17 );

    var spec = new m.ContextBuilder().references( "x, y, z" ).spec();

    var ctx1: any = new m.Context( spec );
    ctx1.x = new m.ArrayContext();
    ctx1.x.length = 10;

    var p1 = new m.Path( ctx1, "x[i]" );
    var o1 = <m.PropertyObserver>(<any>p1).rootObserver;
    ok( o1 instanceof m.PropertyObserver, "property observer" );
    var o2 = <m.ArrayObserver>o1.child;
    ok( o2 instanceof m.ArrayObserver, "array observer" );
    ok( o2.ctx === ctx1.x, "watching array" );
    ok( ctx1.x.changes['#observers'][0] === o2, "array being watched" );
    var t1 = new ObservableTest( [new Result( E.next, {i: 2} ),
                                  new Result( E.next, {i: 8} ),
                                  new Result( E.next, {i: 5} ),
                                  new Result( E.next, {i: 2} ),
                                  new Result( E.next, {i: 5} ),
                                  new Result( E.next, {i: 4} )
                                 ] );
    p1.addObserver( t1 );
    ctx1.x[2] = 1;
    ctx1.x[8] = 2;
    ctx1.x[5] = 3;
    ctx1.x[2] = 6;
    ctx1.x[5] = undefined;
    ctx1.x[4] = 9;
    p1.removeObserver( t1 );

    checkSequence( [p1], [{i: 2}, {i: 4}, {i: 8}] );

    ctx1.b = new m.ArrayContext();
    ctx1.b.length = [10];
    ctx1.b[4] = 10;
    ctx1.b[5] = 9;
    ctx1.b[9] = 8;

    var t2 = new ObservableTest( [new Result( E.next, {} )] );
    p1.addObserver( t2 );

    ctx1.x = ctx1.b;
    checkSequence( [p1], [{i: 4}, {i: 5}, {i: 9}] );

  } );

  test( "context builder", function() {
    expect( 12 );

    var context: any = new m.ContextBuilder()
          .variables( "x, y, z", {x: 3} )
          .constraint( "c", "x, y" )
            .method( "x -> y", id )
            .method( "y -> x", id )
          .output( "x" )
          .touchDep( "z", "x" )
          .context( {z: 5} );
    var x = m.Context.update( context );

    ok( context instanceof m.Context, "ContextBuilder creates a context" );

    var hd_data = context['#hd_data'];
    ok( hd_data, "Context has hd_data" );

    equal( x.adds.filter( u.isType( m.Variable ) ).length, 3,
           "ContextBuilder creates variables" );

    ok( context.x instanceof m.Variable &&
        context.y instanceof m.Variable &&
        context.z instanceof m.Variable,
        "ContextBuilder exposes variables" );

    strictEqual( context.x.optional, m.Optional.Min, "Variable is min-optional" );

    strictEqual( context.y.optional, m.Optional.Min, "Variable is min-optional" );

    strictEqual( context.z.optional, m.Optional.Max, "Variable is max-optional" );

    var ccs = <m.Constraint[]>x.adds.filter( u.isType( m.Constraint ) );
    ok( ccs.length == 1 &&
        ccs[0] instanceof m.Constraint,
        "ContextBuilder creates constraint" );

    var c = ccs[0];
    ok( c.methods.length == 2 &&
        c.methods[0] instanceof m.Method &&
        c.methods[1] instanceof m.Method,
        "ContextBuilder creates methods" );

    ok( context.c,
        "ContextBuilder exposes constraint template" );

    var outs = <m.Output[]>x.adds.filter( u.isType( m.Output ) );
    ok( outs.length == 1 &&
        outs[0] instanceof m.Output &&
        outs[0].variable == context.x,
        "ContextBuilder creates output" );

    var tds = <m.TouchDep[]>x.adds.filter( u.isType( m.TouchDep ) );
    ok( tds.length == 1 &&
        tds[0] instanceof m.TouchDep &&
        tds[0].from == context.z &&
        tds[0].to == context.x,
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
    m.Context.update( ctx );

    ok( ctx.$r instanceof r.BasicSignal, "ContextBuilder creates reference" );

    ctx.$r.addObserver( new ObservableTest(
      [new Result( E.next, 3 ),
       new Result( E.next, 7 )]
    ) );
    ctx.r = 3;
    ctx.r = 7;

    ok( ctx.c,
        "Constraint has a template" );

    equal( ctx.c.getElements().length, 0,
           "Constraint with null references not instantiated" );

    ctx.s = ctx.y;

    var x = m.Context.update( ctx );

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

    ctx.s = undefined;

    x = m.Context.update( ctx );

    ok( x.removes.length == 1 && x.adds.length == 0, "One update" );

    ok( x.removes[0] === c, "Remove old constraint" );

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

    var x = m.Context.update( ctx );

    var ccs = <m.Constraint[]>x.adds.filter( u.isType( m.Constraint ) );

    equal( ccs.length, 2,
           "Created two constraints" );

    var c = ccs[0];
    ok( c instanceof m.Constraint &&
        c.variables.length == 2 &&
        c.variables[0] === ctx.x &&
        c.variables[1] === ctx.y,
        "Constraint looks ok" );

    equal( c.optional, m.Optional.Max,
           "Constraint is optional" );

    equal( c.touchVariables.length, 1,
           "Constraint has touch variables" );

    c = ccs[1];
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
          .constraint(  "b => b, c" )
            .method( "b -> c", id )
          .context();
    x = m.Context.update( ctx );

    equal( x.adds.filter( u.isType( m.Constraint ) ).length, 0, "No constraints" );

    ctx.b = ctx.y;
    var x = m.Context.update( ctx );
    ok( x.removes.length == 0 && x.adds.length == 0,
        "No updates with half-defined constraint" )

    ctx.c = ctx.z;
    var x = m.Context.update( ctx );
    ok( x.removes.length == 0 && x.adds.length == 1,
        "One update" );

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

  test( "slice paths", function() {
    var Spec = new m.ContextBuilder().r( 'x' ).spec();
    var Spec2 = new m.ContextBuilder().n( 'b', hd.arrayOf( Spec ) ).spec();
    var ctx: any = new m.ContextBuilder().n( 'a', hd.arrayOf( hd.arrayOf( Spec2 ) ) ).context();

    var p1 = new m.Path( ctx, 'a[i][*].b[k].x' );

    ctx.a.expand( 3 );
    for (var i = 0; i < 3; ++i) {
      ctx.a[i].expand( 3 );
      for (var j = 0; j < 3; ++j) {
        ctx.a[i][j].b.expand( 3 );
      }
    }

    ctx.a[0][0].b[0].x = 1;
    ctx.a[0][1].b[0].x = 2;
    ctx.a[0][2].b[0].x = 3;

    ctx.a[2][0].b[1].x = 4;
    ctx.a[2][1].b[1].x = 5;
    ctx.a[2][2].b[1].x = 7;

    ctx.a[0][0].b[2].x = 8;
    ctx.a[0][1].b[2].x = 6;
    ctx.a[0][2].b[2].x = 4;

    ctx.a[1][0].b[1].x = 2;
    ctx.a[1][1].b[1].x = 3;
    ctx.a[1][2].b[1].x = 4;

    ctx.a[1][0].b[2].x = 3;
    ctx.a[1][1].b[2].x = 4;
    ctx.a[1][2].b.length = 2;

    ctx.a[0][0].b[1].x = 10;
    ctx.a[1][0].b[0].x = 8;
    ctx.a[1][1].b[0].x = 12;

    deepEqual( p1.get( {i: 0, k: 0} ), [1, 2, 3], "Retrieved slice" );
    deepEqual( p1.get( {i: 2, k: 1} ), [4, 5, 7], "Retrieved slice" );
    deepEqual( p1.get( {i: 0, k: 2} ), [8, 6, 4], "Retrieved slice" );
    deepEqual( p1.get( {i: 1, k: 1} ), [2, 3, 4], "Retrieved slice" );
    strictEqual( p1.get( {i: 1, k: 2} ), undefined, "Undefined for staggered lengths" );
    strictEqual( p1.get( {i: 0, k: 1} ), undefined, "Undefined for missing elements" );
    strictEqual( p1.get( {i: 1, k: 0} ), undefined, "Undefined for missing elements" );

    checkSequence( [p1], [{i: 0, k: 0}, {i: 0, k: 2}, {i: 1, k: 1}, {i: 2, k: 1}] );
  } );
}
