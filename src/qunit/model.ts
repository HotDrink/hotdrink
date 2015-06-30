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

    ok( x.removes[0] === o && x.removes[1] == t,
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

}
