module hd.qunit {

  module( "hd.model" );

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;

  function id<T>( x: T ): T { return x };

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
    ok( hd_data instanceof m.ContextData, "Context has hd_data" );

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

    ok( context.c instanceof m.ConstraintTemplate,
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

    ok( ctx.c instanceof m.ConstraintTemplate,
        "Constraint with references gets a template" );

    equal( m.Context.constraints( ctx ).length, 0,
           "Constraint with references not instantiated" )

    var x = m.Context.reportUpdates( ctx );

    ok( x.removes.length == 0 && x.adds.length == 0,
        "No updates with undefined reference" );

    ctx.s = ctx.y;

    x = m.Context.reportUpdates( ctx );

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

    x = m.Context.reportUpdates( ctx );

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

    x = m.Context.reportUpdates( ctx );

    ok( x.removes.length == 1 && x.adds.length == 0, "One update" );

    ok( x.removes[0] === c, "Remove old constraint" );

    ok( m.Context.constraints( ctx ).length == 0,
        "No constraints in context" );

    equal( m.Context.outputs( ctx ).length, 0, "Context has no outputs" );

    equal( m.Context.touchDeps( ctx ).length, 0, "Context has no touch dependencies" );

    ctx.t = ctx.x;

    x = m.Context.reportUpdates( ctx );

    ok( x.removes.length == 0 && x.adds.length == 2, "Two updates" );

    ok( x.adds[0] instanceof m.Output &&
        (<m.Output>x.adds[0]).variable === ctx.x,
        "Correct output" );

    ok( x.adds[1] instanceof m.TouchDep &&
        (<m.TouchDep>x.adds[1]).from === ctx.y &&
        (<m.TouchDep>x.adds[1]).to === ctx.x,
        "Correct touch dependency" );

    var o = x.adds[0];
    var t = x.adds[1];

    ctx.t = ctx.y;

    x = m.Context.reportUpdates( ctx );

    ok( x.removes.length == 2 && x.adds.length == 1, "Three updates" );

    ok( x.removes[0] === t && x.removes[1] == o,
        "Remove old elements" );

    ok( x.adds[0] instanceof m.Output &&
        (<m.Output>x.adds[0]).variable === ctx.y,
        "Correct output" );

    o = x.adds[0];

    ctx.t = undefined;

    x = m.Context.reportUpdates( ctx );

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
    m.Context.performUpdates( ctx );

    equal( m.Context.constraints( ctx ).length, 2,
           "Created optional constraints" );

    var c = m.Context.constraints( ctx )[0];
    ok( c instanceof m.Constraint &&
        c.variables.length == 2 &&
        c.variables[0] === ctx.x &&
        c.variables[1] === ctx.y,
        "Constraint looks ok" );

    equal( m.Context.touchDeps( ctx ).length, 3,
           "Created touch dependencies for optional constraints" );

    var t = m.Context.touchDeps( ctx )[0];
    ok( t instanceof m.TouchDep &&
        t.from === ctx.x &&
        t.to === c,
        "Touch dependency looks ok" );

    c = m.Context.constraints( ctx )[1];
    ok( c instanceof m.Constraint &&
        c.variables.length == 2 &&
        c.variables[0] === ctx.y &&
        c.variables[1] === ctx.z,
        "Constraint looks ok" );

    t = m.Context.touchDeps( ctx )[1];
    ok( t instanceof m.TouchDep &&
        t.from === ctx.x &&
        t.to === c,
        "Touch dependency looks ok" );

    t = m.Context.touchDeps( ctx )[2];
    ok( t instanceof m.TouchDep &&
        t.from === ctx.y &&
        t.to === c,
        "Touch dependency looks ok" );

    ctx = new m.ContextBuilder()
          .variables( "x, y, z", {x: 3, y: 4, z: 5} )
          .references( "a, b, c" )
          .constraint(  "a, b => b, c" )
            .method( "b -> c", id )
          .context();
    m.Context.performUpdates( ctx );

    equal( m.Context.constraints( ctx ).length, 0, "No constraints" );
    equal( m.Context.touchDeps( ctx ).length, 0, "No touch dependencies" );

    ctx.b = ctx.y;
    var x = m.Context.reportUpdates( ctx );
    ok( x.removes.length == 0 && x.adds.length == 0,
        "No updates with half-defined constraint" )

    ctx.c = ctx.z;
    var x = m.Context.reportUpdates( ctx );
    ok( x.removes.length == 0 && x.adds.length == 2,
        "Two updates" );

    ok( x.adds[0] instanceof m.Constraint, "One is constraint" );
    ok( x.adds[1] instanceof m.TouchDep, "One is touch dep" );

    var c = <m.Constraint>x.adds[0];
    ok( c.variables.length == 2 &&
        c.variables[0] === ctx.y &&
        c.variables[1] === ctx.z,
        "Constraint uses correct variables" );

    var t1 = <m.TouchDep>x.adds[1];
    ok( t1.from === ctx.y && t1.to === c,
        "Touch dep uses correct variables" );

    ctx.a = ctx.x;
    x = m.Context.reportUpdates( ctx );
    ok( x.removes.length == 0 && x.adds.length == 1,
        "One update" );

    ok( x.adds[0] instanceof m.TouchDep, "Update is touch dep" );

    var t2 = <m.TouchDep>x.adds[0];
    ok( t2.from === ctx.x && t2.to === c,
        "Touch dep uses correct variables" );

    ctx.c = undefined;
    x = m.Context.reportUpdates( ctx );
    ok( x.removes.length == 3 && x.adds.length == 0, "Three updates" );
    ok( x.removes[0] === t1, "Remove touch dep 1" );
    ok( x.removes[1] === t2, "Remove touch dep 2" );
    ok( x.removes[2] === c,  "Remove constraint" );

  } );

  test( "array contexts", function() {

    var a = new m.ArrayContext();
    a.length = 10;
    a.changes.addObserver( new ObservableTest(
      [new Result( E.next, 3 ),
       new Result( E.next, 8 ),
       new Result( E.next, 4 ),
       new Result( E.next, 10 ),
       new Result( E.next, 3 ),
       new Result( E.next, 8 ),
       new Result( E.next, 11 ),
       new Result( E.next, 12 ),
       new Result( E.next, 12 ),
       new Result( E.next, 11 ),
       new Result( E.next, 10 ),
       new Result( E.next, 9 ),
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

    a.length = 8;
    equal( a.length, 8, "Set length 2" );

  } );
}
