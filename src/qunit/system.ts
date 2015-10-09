var ps: hd.reactive.Promise<any>[];

module hd.qunit {

  module( "hd.system" );

  import u = hd.utility;
  import r = hd.reactive;
  import g = hd.graph;
  import m = hd.model;
  import s = hd.system;

  function plus1( x: number ): number {
    return x + 1;
  }

  function checkVariable( vv: m.Variable, value: number, text: string ) {
    vv.getCurrentPromise().then( function( x: number ) {
      equal( x, value, text );
    } );
  }

  function checkVariables( ctx: m.Context, values: u.Dictionary<number>, suffix: string ) {
    for (var key in values) {
      checkVariable( ctx[key], values[key], key + "_" + suffix );
    }
  }

  function getPromises( ctx: m.Context ) {
    var promises: u.Dictionary<r.Promise<any>> = {};
    for (var id in ctx) {
      var vv = ctx[id];
      if (vv instanceof m.Variable) {
        promises[id] = vv.getCurrentPromise();
      }
    }
    return promises;
  }

  function delay( value: any ): r.Promise<any> {
    var q = new r.Promise();
    setTimeout( function() { q.resolve( value ); }, 500 );
    return q;
  }

  function differences( a: string[], b: string[] ) {
    var diff = {add: 0, drop: 0};
    var i = 0, j = 0, l = a.length, m = b.length;
    while (i < l && j < m) {
      var cmp = a[i].localeCompare( b[j] )
      if (cmp < 0) {
        ++diff.drop;
        ++i;
      }
      else if (cmp > 0) {
        ++diff.add;
        ++j;
      }
      else {
        ++i;
        ++j;
      }
    }

    while (i < l) {
      ++diff.drop;
      ++i;
    }

    while (j < m) {
      ++diff.add;
      ++j;
    }

    return diff;
  }

  asyncTest( "empty property model", function() {
    expect( 3 );
    var pm = new s.PropertyModel();
    pm.update();

    var x = new m.Variable( "x", 4 );
    var y = new m.Variable( "y", 5 );
    var z = new m.Variable( "z", 6 );
    pm.addVariable( x );
    pm.addVariable( y );
    pm.addVariable( z );

    var c = new m.Constraint( "x,y,z", [x, y, z] );
    pm.addConstraint( c );
    pm.update();

    pm.removeConstraint( c );
    c.addMethod( new m.Method( "x,y->z", hd.reactive.liftFunction( sum ), [x,y], null, [z], [x,y], [z] ) );
    pm.addConstraint( c );
    pm.update();

    checkVariable( x, 4, "x" );
    checkVariable( y, 5, "y" );
    checkVariable( z, 9, "z" );

    u.schedule( 3, start );
  } );

  test( "initial priorities", function() {
    expect( 12 );

    var ctx: any = new m.ContextBuilder()
          .variables( "a, b, c, d", {a: 1, b: 2} )
          .variables( "l, m, n, o", {l: 3, m: 4} )
          .optional( hd.MaxOptional )
          .variables( "w, x, y, z", {w: 5, x: 6} )
          .optional( hd.MinOptional )
          .context( {b: 7, c: 8, m: 9, n: 10, x: 11, y: 12} );

    var pm = new hd.PropertyModel();
    pm.addComponent( ctx );

    // a = default/spec-init  =>  min/init  =>  II
    // b = default/both-init  =>  max/init  =>  IIII
    // c = default/inst-init  =>  max/init  =>  IIII
    // d = default            =>  min/unin  =>  I
    // l = max/spec-init      =>  max/init  =>  IIII
    // m = max/both-init      =>  max/init  =>  IIII
    // n = max/inst-init      =>  max/init  =>  IIII
    // o = max                =>  max/unin  =>  III
    // w = min/spec-init      =>  min/init  =>  II
    // x = min/both-init      =>  min/init  =>  II
    // y = min/inst-init      =>  min/init  =>  II
    // z = min                =>  min/unin  =>  I

    // d = default            =>  min/unin  =>  I
    // z = min                =>  min/unin  =>  I
    // a = default/spec-init  =>  min/init  =>  II
    // w = min/spec-init      =>  min/init  =>  II
    // x = min/both-init      =>  min/init  =>  II       ^
    // y = min/inst-init      =>  min/init  =>  II       |
    // =================================================
    // o = max                =>  max/unin  =>  III      |
    // b = default/both-init  =>  max/init  =>  IIII     v
    // c = default/inst-init  =>  max/init  =>  IIII
    // l = max/spec-init      =>  max/init  =>  IIII
    // m = max/both-init      =>  max/init  =>  IIII
    // n = max/inst-init      =>  max/init  =>  IIII

    var opt = (<any>pm).planner.getOptionals();

    var pri = [g.stayConstraint( ctx.d.id ),
               g.stayConstraint( ctx.z.id ),
               g.stayConstraint( ctx.a.id ),
               g.stayConstraint( ctx.w.id ),
               g.stayConstraint( ctx.x.id ),
               g.stayConstraint( ctx.y.id ),
               g.stayConstraint( ctx.o.id ),
               g.stayConstraint( ctx.b.id ),
               g.stayConstraint( ctx.c.id ),
               g.stayConstraint( ctx.l.id ),
               g.stayConstraint( ctx.m.id ),
               g.stayConstraint( ctx.n.id )];

    for (var i = 0, l = pri.length; i < l; ++i) {
      equal( opt[i], pri[i], "Correct priority assignment " + i );
    }
  } )

  asyncTest( "simple constraint", function() {
    expect( 12 );

    var ctx: any = new m.ContextBuilder()
          .variables( "x, y, z", {x: 3, y: 4} )
          .constraint( "x, y, z" )
          .method( "x, y -> z", sum )
          .method( "z, x -> y", diff )
          .method( "z, y -> x", diff )
          .context();

    var pm = new s.PropertyModel();
    pm.addComponent( ctx );
    pm.update();

    checkVariable( ctx.x, 3, "x_1" );
    checkVariable( ctx.y, 4, "y_1" );
    checkVariable( ctx.z, 7, "z_1" );

    ctx.z.set( 10 );

    checkVariable( ctx.x, 3, "x_1 (repeat)" );
    checkVariable( ctx.y, 4, "y_1 (repeat)" );
    checkVariable( ctx.z, 7, "z_1 (repeat)" );

    pm.update();

    checkVariable( ctx.x, 6, "x_2" );
    checkVariable( ctx.y, 4, "y_2" );
    checkVariable( ctx.z, 10, "z_2" );

    ctx.y.set( 8 );
    ctx.x.set( 10 );
    ctx.z.set( 15 );
    pm.update();

    checkVariable( ctx.x, 10, "x_3" );
    checkVariable( ctx.y, 5, "y_3" );
    checkVariable( ctx.z, 15, "z_3" );

    u.schedule( 3, start );
  } );

  asyncTest( "multiple constraints", function() {
    expect( 24 );

    var ctx: any = new m.ContextBuilder()
          .variables( "a, b, c, d, e, f, g",
                      {a: 2, b: 4, d: 6, f: 8} )
          .equation( "a + b == c" )
          .equation( "c + d == e" )
          .equation( "e + f == g" )
          .context();

    var pm = new s.PropertyModel();
    pm.addComponent( ctx );
    pm.update();
    checkVariables( ctx, {a: 2, b: 4, c: 6, d: 6, e: 12, f: 8, g: 20}, "1" );

    ctx.g.set( 50 );
    pm.update();
    checkVariables( ctx, {g: 50, f: 8, e: 42, d: 6, c: 36, b: 4, a: 32}, "2" );

    var e = ctx.e.getCurrentPromise();
    var f = ctx.f.getCurrentPromise();
    var g = ctx.g.getCurrentPromise();

    ctx.c.set( 10 );
    pm.update();
    checkVariables( ctx, {c: 10, b: 4, a: 6, d: 32}, "3" );

    ok( e === ctx.e.getCurrentPromise() &&
        f === ctx.f.getCurrentPromise() &&
        g === ctx.g.getCurrentPromise(),
        "Did not run unnecessary methods" );

    var a = ctx.a.getCurrentPromise();
    var b = ctx.b.getCurrentPromise();
    var c = ctx.c.getCurrentPromise();

    ctx.e.set( 10 );
    pm.update();
    checkVariables( ctx, {e: 10, d: 0, g: 50, f: 40}, "4" );

    ok( a === ctx.a.getCurrentPromise() &&
        b === ctx.b.getCurrentPromise() &&
        c === ctx.c.getCurrentPromise(),
        "Did not run unnecessary methods" );

    u.schedule( 3, start );
  } );

  asyncTest( "asynchronous constraints", function() {
    expect( 26 );

    var ctx: any = new m.ContextBuilder()
          .variables( "a, b, c, d, e", {a: 5, b: 7} )
          .constraint( "a, b, c" )
          .method( "a, b -> c", function( a: any, b: any ) {
            return delay( a + b );
          } )
          .method( "c, b -> a", function( c: any, b: any ) {
            return delay( c - b );
          } )
          .method( "c, a -> b", function( c: any, a: any ) {
            return new r.Promise();
          } )
          .constraint( "c, d, e" )
          .method( "c -> d, e", function( c: any ) {
            return [delay( c/2), delay( c/2 )];
          } )
          .method( "d, e -> c", function( d: any, e: any ) {
            return delay( d + e );
          } )
          .context();

    ps = [];

    var pm = new s.PropertyModel();
    pm.addComponent( ctx );
    pm.update();
    checkVariables( ctx, {a: 5, b: 7, c: 12, d: 6, e: 6}, "1" );
    ps.push( ctx.d.getCurrentPromise() );

    ctx.d.set( 4 );
    pm.update();
    checkVariables( ctx, {a: 3, b: 7, c: 10, d: 4, e: 6}, "2" );
    ps.push( ctx.a.getCurrentPromise() );

    ctx.a.set( 4 );
    pm.update();
    ctx.b.getCurrentPromise().then( function() { ok( false, "Should not resolve" ) } );

    ctx.b.set( 6 );
    pm.update();
    checkVariables( ctx, {a: 4, b: 6, c: 10, d: 5, e: 5}, "4" );
    ps.push( ctx.d.getCurrentPromise() );

    ctx.c.set( 16 );
    pm.update();
    checkVariables( ctx, {a: 10, b: 6, c: 16, d: 8, e: 8}, "5" );
    ps.push( ctx.a.getCurrentPromise() );

    ctx.e.set( 2 );
    pm.update();
    checkVariables( ctx, {a: 4, b: 6, c: 10, d: 8, e: 2}, "6" );
    ps.push( ctx.a.getCurrentPromise() );

    r.Promise.all.apply( null, ps ).then( function() {
      ok( ! ctx.a.pending.get() &&
          ! ctx.b.pending.get() &&
          ! ctx.c.pending.get() &&
          ! ctx.d.pending.get() &&
          ! ctx.e.pending.get(),
          "All variables fulfilled" );
      u.schedule( 3, start );
    } );
  } );

  asyncTest( "dynamic constraints", function() {
    expect( 43 );

    var ctx: any = new m.ContextBuilder()
          .variables( "a, b, c, d, e, f", {a: 1, b: 2, e: 3, f: 4} )
          .references( "x, y" )
          .equation( "a + b == c" )
          .equation( "d == e + f" )
          .equation( "x + 1 == y" )
          .context();

    var pm = new s.PropertyModel();
    pm.addComponent( ctx );
    pm.update();

    checkVariables( ctx, {a: 1, b: 2, c: 3, d: 7, e:3, f: 4}, "1" );

    var last: any = getPromises( ctx );
    ctx.x = ctx.c;
    pm.update();

    var cur: any = getPromises( ctx );
    ok( last.a === cur.a &&
        last.b === cur.b &&
        last.c === cur.c &&
        last.d === cur.d &&
        last.e === cur.e &&
        last.f === cur.f,
        "No unnecessary updates" );

    ok( cur.c === cur.x, "Reference correct" );

    ctx.y = ctx.d;
    pm.update();
    checkVariables( ctx, {a: 4, b: 2, c: 6, d: 7, e: 3, f: 4}, "2" );

    last = getPromises( ctx );
    ctx.a.set( 1 )
    pm.update();
    cur = getPromises( ctx );
    checkVariables( ctx, {a: 1, b: 5, c: 6}, "3" );

    ok( last.d === cur.d &&
        last.e === cur.e &&
        last.f === cur.f,
        "No unnecessary updates" );

    last = cur;
    ctx.b.set( 2 );
    pm.update();
    cur = getPromises( ctx );
    checkVariables( ctx, {b: 2, c: 3, d: 4, e: 0, f: 4}, "4" )
    ok( last.a === cur.a, "No unnecessary updates" );

    last = cur;
    ctx.x = 10;
    pm.update();
    cur = getPromises( ctx );
    checkVariables( ctx, {d: 11, e: 7, f: 4}, "5" );
    ok( last.a === cur.a &&
        last.b === cur.b &&
        last.c === cur.c,
        "No unnecessary updates" );

    ctx.f.set( 5 );
    pm.update();
    checkVariables( ctx, {d: 11, e: 6, f: 5}, "6" );

    ctx.e.set( 3 );
    pm.update();
    checkVariables( ctx, {d: 11, e: 3, f: 8}, "7" );

    ctx.x = ctx.d;
    ctx.f.set( 6 );
    pm.update();
    checkVariables( ctx, {d: 9, e: 3, f: 6}, "8" );

    ctx.y = ctx.c;
    pm.update();
    checkVariables( ctx, {f: 6, e: 3, d: 9, c: 10, b: 2, a: 8}, "9" );

    u.schedule( 3, start );

  } );

  asyncTest( "optional constraints", function() {
    expect( 18 );

    var ctx: any = new m.ContextBuilder()
          .variables( "x, y, z", {x: 4} )
          .constraint( "x => x, y" )
            .method( "x -> y", id )
          .constraint( "x, y => y, z" )
            .method( "y -> z", id )
          .context();

    var pm = new s.PropertyModel();
    pm.addComponent( ctx );
    pm.update();
    checkVariables( ctx, {x: 4, y: 4, z: 4}, "1" );

    ctx.y.set( 5 );
    pm.update();
    checkVariables( ctx, {x: 4, y: 5, z: 5}, "2" );

    ctx.z.set( 6 );
    pm.update();
    checkVariables( ctx, {x: 4, y: 5, z: 6}, "3" );

    ctx.x.set( 7 );
    pm.update();
    checkVariables( ctx, {x: 7, y: 7, z: 7}, "4" );

    ctx.x.set( 8 );
    ctx.z.set( 9 );
    pm.update();
    checkVariables( ctx, {x: 8, y: 8, z: 9}, "5" );

    ctx.x.set( 1 );
    pm.update();
    checkVariables( ctx, {x: 1, y: 1, z: 1}, "6" );

    u.schedule( 3, start );
  } );

  asyncTest( "array constraints", function() {
    expect( 63 );

    var rowspec = new m.ContextBuilder()
          .variables( "begin, end", {begin: 0, end: 10} )
          .spec();

    var ctx: any = new m.ContextBuilder()
          .nested( "a", hd.arrayOf( rowspec ) )
          .nested( "b", hd.arrayOf( <any>m.Variable ) )
          .constraint( "a[i].begin, a[i].end, b[i]" )
            .method( "a[i].end, a[i].begin -> b[i]", diff )
            .method( "a[i].end, b[i] -> a[i].begin", diff )
            .method( "a[i].begin, b[i] -> a[i].end", sum )
          .context();

    var pm = new s.PropertyModel();
    pm.addComponent( ctx );
    pm.update();

    ctx.a.expand( 1 );
    ctx.b.expand( 1 );
    pm.update();

    checkVariable( ctx.a[0].begin, 0, "a[0].begin" );
    checkVariable( ctx.a[0].end, 10, "a[0].end" );
    checkVariable( ctx.b[0], 10, "b[0]" );

    ctx.a.expand( 1 );
    ctx.a[1].begin.set( 5 );
    ctx.a[1].end.set( 20 );
    ctx.b.expand( 1 );
    pm.update();

    checkVariable( ctx.a[0].begin, 0, "a[0].begin" );
    checkVariable( ctx.a[0].end, 10, "a[0].end" );
    checkVariable( ctx.b[0], 10, "b[0]" );
    checkVariable( ctx.a[1].begin, 5, "a[1].begin" );
    checkVariable( ctx.a[1].end, 20, "a[1].end" );
    checkVariable( ctx.b[1], 15, "b[1]" );


    var EventSpec = new hd.ContextBuilder()
          .variables( "begin, end, length" )
          .equation( "begin + length == end" )
          .spec();

    var schedule: any = new hd.ContextBuilder()
          .nested( "events", hd.arrayOf( EventSpec ) )
          .constraint( "events[i].end, events[i+1].begin" )
          .method( "events[i].end, !events[i+1].begin -> events[i+1].begin", hd.max )
          .method( "!events[i].end, events[i+1].begin -> events[i].end", hd.min )
          .context();

    var pm = new hd.PropertyModel();
    pm.addComponent( schedule );

    schedule.events.expand( {begin: 0, end: 10} );
    pm.update();
    checkVariables( schedule.events[0], {begin: 0, end: 10, length: 10}, "[0]_1" );

    var ccs = Object.keys( pm.constraints );
    ccs.sort();

    schedule.events.expand( {begin: 20, length: 5} );
    pm.update();
    checkVariables( schedule.events[0], {begin: 0, end: 10, length: 10}, "[0]_2" );
    checkVariables( schedule.events[1], {begin: 20, end: 25, length: 5}, "[1]_2" );

    var ccs2 = Object.keys( pm.constraints );
    ccs2.sort();
    var d = differences( ccs, ccs2 );
    equal( d.drop, 0,
           "Removed zero constraints" );
    equal( d.add, 2,
           "Added two constraints" );
    ccs = ccs2;

    schedule.events.expand( {begin: 5, length: 20}, 1 );
    pm.update();
    checkVariables( schedule.events[0], {begin: 0, end: 5, length: 5}, "[0]_3" );
    checkVariables( schedule.events[1], {begin: 5, end: 25, length: 20}, "[1]_3" );
    checkVariables( schedule.events[2], {begin: 25, end: 30, length: 5}, "[2]_3" );

    ccs2 = Object.keys( pm.constraints );
    ccs2.sort();
    d = differences( ccs, ccs2 );
    equal( d.drop, 1,
           "Removed one constraints" );
    equal( d.add, 3,
           "Added three constraints" );
    ccs = ccs2;

    schedule.events[0].length.set( 10 );
    schedule.events[1].length.set( 20 );
    schedule.events[2].length.set( 30 );
    schedule.events.expand( {begin: 0, length: 5}, 0 );
    pm.update();
    checkVariables( schedule.events[0], {begin: 0, end: 5, length: 5}, "[0]_4" );
    checkVariables( schedule.events[1], {begin: 5, end: 15, length: 10}, "[1]_4" );
    checkVariables( schedule.events[2], {begin: 15, end: 35, length: 20}, "[2]_4" );
    checkVariables( schedule.events[3], {begin: 35, end: 65, length: 30}, "[3]_4" );

    ccs2 = Object.keys( pm.constraints );
    ccs2.sort();
    d = differences( ccs, ccs2 );
    equal( d.drop, 0,
           "Removed zero constraints" );
    equal( d.add, 2,
           "Added two constraints" );
    ccs = ccs2;

    schedule.events.collapse( 1, 1 );
    pm.update();
    checkVariables( schedule.events[0], {begin: 0, end: 5, length: 5}, "[0]_5" );
    checkVariables( schedule.events[1], {begin: 15, end: 35, length: 20}, "[2]_5" );
    checkVariables( schedule.events[2], {begin: 35, end: 65, length: 30}, "[3]_5" );

    ccs2 = Object.keys( pm.constraints );
    ccs2.sort();
    d = differences( ccs, ccs2 );
    equal( d.drop, 3,
           "Removed three constraints" );
    equal( d.add, 1,
           "Added one constraints" );
    ccs = ccs2;

    schedule.events.expand( [{begin: 0, length: 10}, {begin: 10, length: 20}, {begin: 30, length: 10}], 0 );
    pm.update();
    checkVariables( schedule.events[5], {begin: 65, end: 95, length: 30}, "[5]_6" );

    ccs2 = Object.keys( pm.constraints );
    ccs2.sort();
    d = differences( ccs, ccs2 );
    equal( d.drop, 0,
           "Removed zero constraints" );
    equal( d.add, 6,
           "Added six constraints" );
    ccs = ccs2;

    schedule.events.collapse( 2, 2 );
    pm.update()

    ccs2 = Object.keys( pm.constraints );
    ccs2.sort();
    d = differences( ccs, ccs2 );
    equal( d.drop, 5,
           "Removed five constraints" );
    equal( d.add, 1,
           "Added one constraints" );
    ccs = ccs2;

    u.schedule( 3, start );
  } );

  asyncTest( "topological sorting", function() {
    expect( 42 );

    var ctx: any = new m.ContextBuilder()
          .variables( "a, b, c, x, y, z", {a: 3, b: 4, z: 6} )
          .constraint( "a => a, x" )
            .method( "a -> x", id )
          .constraint( "b, y" )
            .method( "b -> y", plus1 )
            .method( "y -> b", plus1 )
          .constraint( "c, x, y, z" )
            .method( "x, y, z -> c",
                     function( x: number, y: number, z: number ) {
                       return x + y + z
                     }
                   )
            .method( "c -> x, y, z",
                     function( c: number ) { return [c/3, c/3, c/3]; }
                   )
          .context();

    var pm = new s.PropertyModel();
    pm.addComponent( ctx );
    pm.update();
    checkVariables( ctx, {a: 3, b: 4, c: 14, x: 3, y: 5, z: 6}, "1" );

    ctx.c.set( 21 );
    pm.update();
    checkVariables( ctx, {a: 3, b: 8, c: 21, x: 7, y: 7, z: 7}, "2" );

    ctx.z.set( 2 );
    pm.update();
    checkVariables( ctx, {a: 3, b: 8, c: 16, x: 7, y: 7, z: 2}, "3" );

    ctx.a.set( 4 );
    pm.update();
    checkVariables( ctx, {a: 4, b: 8, c: 13, x: 4, y: 7, z: 2}, "4" );

    ctx.b.set( 5 );
    pm.update();
    checkVariables( ctx, {a: 4, b: 5, c: 12, x: 4, y: 6, z: 2}, "5" );

    ctx.c.set( 3 );
    pm.update();
    checkVariables( ctx, {a: 4, b: 2, c: 3, x: 1, y: 1, z: 1}, "6" );

    ctx.z.set( 8 );
    pm.update();
    checkVariables( ctx, {a: 4, b: 2, c: 10, x: 1, y: 1, z: 8}, "7" );

    u.schedule( 3, start );
  } );

  asyncTest( "set commands", function() {
    expect( 12 );

    var ctx: any = new m.ContextBuilder()
          .variables( "x, y, z", {x: 3, y: 5} )
          .constraint( "x, y, z" )
          .method( "x, y -> z", sum )
          .method( "z, x -> y", diff )
          .method( "z, y -> x", diff )
          .context();

    var pm = new s.PropertyModel
    pm.addComponent( ctx );
    pm.update();
    checkVariables( ctx, {x: 3, y: 5, z: 8}, "1" );

    ctx.x.commandSet( 4 );
    pm.performCommands();
    checkVariables( ctx, {x: 4, y: 5, z: 9}, "2" );

    ctx.y.commandSet( 3 );
    ctx.z.commandSet( 10 );
    checkVariables( ctx, {x: 4, y: 5, z: 9}, "2 (again)" );

    pm.performCommands();
    checkVariables( ctx, {x: 7, y: 3, z: 10}, "4" );

    u.schedule( 3, start );
  } );

  asyncTest( "command queue", function() {
    var spec = new m.ContextBuilder()
          .variables( "a, x, y, z", {a: 12, x: 3, y: 5} )
          .constraint( "x, y, z" )
          .method( "x, y -> z", sum )
          .method( "z -> x, y", function( z: number ) { return [z/2, z/2]; } )
          .command( "cmd", "a -> x", plus1 )
          .spec();

    var pm = new s.PropertyModel

    var ctx1: any = new m.Context();
    m.Context.construct( ctx1, spec );
    pm.addComponent( ctx1 );

    var ctx2: any = new m.Context();
    m.Context.construct( ctx2, spec );
    pm.addComponent( ctx2 );

    var ctx3: any = new m.Context();
    m.Context.construct( ctx3, spec );
    pm.addComponent( ctx3 );

    pm.update();
    checkVariables( ctx1, {a: 12, x: 3, y: 5, z: 8}, "1.1" );
    checkVariables( ctx2, {a: 12, x: 3, y: 5, z: 8}, "1.2" );
    checkVariables( ctx3, {a: 12, x: 3, y: 5, z: 8}, "1.3" );

    ctx1.z.commandSet( 12 );
    ctx2.z.commandSet( 12 );
    ctx3.z.commandSet( 12 );

    ctx2.a.commandSet( 9 );
    ctx3.a.commandSet( 9 );

    ctx3.cmd.activate();

    checkVariables( ctx1, {a: 12, x: 3, y: 5, z: 8}, "1.1 (again)" );
    checkVariables( ctx2, {a: 12, x: 3, y: 5, z: 8}, "1.2 (again)" );
    checkVariables( ctx3, {a: 12, x: 3, y: 5, z: 8}, "1.3 (again)" );

    u.schedule( 3, function() {
      checkVariables( ctx1, {a: 12, x: 6, y: 6, z: 12}, "2.1" );
    } );

    u.schedule( 3, function() {
      checkVariables( ctx2, {a: 9, x: 6, y: 6, z: 12}, "3.2" );
    } );

    u.schedule( 3, function() {
      checkVariables( ctx3, {a: 9, x: 10, y: 6, z: 16}, "3.2" );
    } );

    u.schedule( 3, start );
  } );

  asyncTest( "array moving", function() {
    expect( 36 );

    var rowspec = new ContextBuilder()
          .variables( "begin, end, length", {length: 20} )
          .constraint( "begin, length, end" )
          .method( "begin, length -> end", hd.sum )
          .method( "end, length -> begin", hd.diff )
          .spec();

    var ctx: any = new m.ContextBuilder()
          .nested( "a", hd.arrayOf( rowspec ) )
          .constraint( "a[i].end, a[i+1].begin" )
            .method( "a[i].end, !a[i+1].begin -> a[i+1].begin", hd.max )
            .method( "!a[i].end, a[i+1].begin -> a[i].end", hd.min )
          .context();

    var pm = new hd.PropertyModel();
    pm.addComponent( ctx );

    ctx.a.expand( 4 );
    pm.commitModifications();
    ctx.a[0].begin.set( 100 );
    pm.update();

    checkVariables( ctx.a[0], {begin: 100, end: 120, length: 20}, "0.0" );
    checkVariables( ctx.a[1], {begin: 120, end: 140, length: 20}, "0.1" );
    checkVariables( ctx.a[2], {begin: 140, end: 160, length: 20}, "0.2" );
    checkVariables( ctx.a[3], {begin: 160, end: 180, length: 20}, "0.3" );

    ctx.a.move( 0, 2 );
    pm.update();

    checkVariables( ctx.a[0], {begin:  80, end: 100, length: 20}, "1.0" );
    checkVariables( ctx.a[1], {begin: 100, end: 120, length: 20}, "1.1" );
    checkVariables( ctx.a[2], {begin: 120, end: 140, length: 20}, "1.2" );
    checkVariables( ctx.a[3], {begin: 160, end: 180, length: 20}, "1.3" );

    ctx.a.move( 2, 1, 2 );
    pm.update();

    checkVariables( ctx.a[0], {begin:  60, end:  80, length: 20}, "2.0" );
    checkVariables( ctx.a[1], {begin:  80, end: 100, length: 20}, "2.1" );
    checkVariables( ctx.a[2], {begin: 100, end: 120, length: 20}, "2.2" );
    checkVariables( ctx.a[3], {begin: 120, end: 140, length: 20}, "2.3" );

    u.schedule( 3, start );
  } );

  asyncTest( "slice constraints", function() {
    var ctx: any = new m.ContextBuilder()
          .nested( "a", hd.arrayOf( hd.Variable ) )
          .v( "sum" )
          .c( "a[*], sum" )
          .m( "a[*] -> sum", function( a: number[] ) {
            var sum = 0;
            for (var i = 0; i < a.length; ++i) {
              sum+= a[i];
            }
            return sum;
          } )
          .context();

    ctx.a.expand( [2, 4, 6, 8, 10] );

    var pm = new hd.PropertyModel();
    pm.addComponent( ctx );
    pm.update();
    checkVariables( ctx, {sum: 30}, "0" );

    ctx.a[3].set( 12 );
    pm.update();
    checkVariables( ctx, {sum: 34}, "1" );

    ctx.a.expand( [14] );
    pm.update();
    checkVariables( ctx, {sum: 48}, "2" );

    ctx.a.collapse( 2 );
    pm.update();
    checkVariables( ctx, {sum: 24}, "3" );

    ctx.a.length = 5;
    ctx.a[0].set( 5 );
    pm.update();
    // Because ctx.a contains an undefined, constraint should be uninstantiated
    // Therefore, sum should remain unchanged
    checkVariables( ctx, {sum: 24}, "3" );

    ctx.a.length = 4;
    pm.update()
    // Now they are all defined again
    checkVariables( ctx, {sum: 27}, "4" );

    u.schedule( 3, start );
  } );

  asyncTest( "matrix test", function() {
    expect( 25 );

    var Matrix = hd.arrayOf( hd.arrayOf( hd.Variable ) );

    function dotProduct( n: number[], m: number[] ) {
      var dot = 0;
      for (var i = 0, l = n.length; i < l; ++i) {
        dot += n[i] * m[i];
      }
      return dot;
    }

    var ctx: any = new m.ContextBuilder()
          .n( "a", Matrix )
          .n( "b", Matrix )
          .n( "c", Matrix )
          .c( "a[i][*], b[*][j], c[i][j]" )
          .m( "a[i][*], b[*][j] -> c[i][j]", dotProduct )
          .context();

    ctx.a.expand( [[1, 2, 3],
                   [4, 5, 6] ] );
    ctx.b.expand( [[2, 4],
                   [6, 8],
                   [10, 12]] );
    ctx.c.expand( [[0, 0],
                   [0, 0]] );

    var pm = new hd.PropertyModel();
    pm.addComponent( ctx );
    pm.update();
    checkVariables( ctx.c[0], <any>[/* 1*2 + 2*6 + 3*10 == */44,
                                    /* 1*4 + 2*8 + 3*12 == */56], "0.0" );
    checkVariables( ctx.c[1], <any>[/* 4*2 + 5*6 + 6*10 == */98,
                                    /* 4*4 + 5*8 + 6*12 == */128], "1.0" );

    ctx.a[0][1].set( -2 );
    pm.update();
    checkVariables( ctx.c[0], <any>[/* 1*2 - 2*6 + 3*10 == */20,
                                    /* 1*4 - 2*8 + 3*12 == */24], "0.1" );
    checkVariables( ctx.c[1], <any>[/* 4*2 + 5*6 + 6*10 == */98,
                                    /* 4*4 + 5*8 + 6*12 == */128], "1.1" );

    ctx.a[1][2].set( 2 );
    ctx.b[0][0].set( 1 );
    pm.update();
    checkVariables( ctx.c[0], <any>[/* 1*1 - 2*6 + 3*10 == */19,
                                    /* 1*4 - 2*8 + 3*12 == */24], "0.2" );
    checkVariables( ctx.c[1], <any>[/* 4*1 + 5*6 + 2*10 == */54,
                                    /* 4*4 + 5*8 + 2*12 == */80], "1.2" );

    ctx.a[0].expand( [4] );
    ctx.a[1].expand( [5] );
    ctx.b.expand( [[14, 16]] );
    pm.update();
    checkVariables( ctx.c[0], <any>[/* 1*1 - 2*6 + 3*10 + 4*14 == */75,
                                    /* 1*4 - 2*8 + 3*12 + 4*16 == */88], "0.3" );
    checkVariables( ctx.c[1], <any>[/* 4*1 + 5*6 + 2*10 + 5*14 == */124,
                                    /* 4*4 + 5*8 + 2*12 + 5*16 == */160], "1.3" );

    ctx.a.expand( [[1, 2, 1, 2]] );
    ctx.b[0].expand( [1] );
    ctx.b[1].expand( [-1] );
    ctx.b[2].expand( [1] );
    ctx.b[3].expand( [-1] );
    ctx.c[0].expand( [0] );
    ctx.c[1].expand( [0] );
    ctx.c.expand( [[0, 0, 0]] );
    pm.update();
    checkVariables( ctx.c[0], <any>[/* 1*1 - 2*6 + 3*10 + 4*14 == */75,
                                    /* 1*4 - 2*8 + 3*12 + 4*16 == */88,
                                    /* 1*1 + 2*1 + 3*1  - 4*1  == */2], "0.4" );
    checkVariables( ctx.c[1], <any>[/* 4*1 + 5*6 + 2*10 + 5*14 == */124,
                                    /* 4*4 + 5*8 + 2*12 + 5*16 == */160,
                                    /* 4*1 - 5*1 + 2*1  - 5*1  == */-4], "1.4" );
    checkVariables( ctx.c[2], <any>[/* 1*1 + 2*6 + 1*10 + 2*14 == */51,
                                    /* 1*4 + 2*8 + 1*12 + 2*16 == */64,
                                    /* 1*1 - 2*1 + 1*1  - 2*1  == */-2], "2.4" );

    u.schedule( 4, start );
  } );
}
