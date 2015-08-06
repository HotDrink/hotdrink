var ps: hd.reactive.Promise<any>[];

module hd.qunit {

  module( "hd.system" );

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;
  import s = hd.system;

  export
  function id<T>( x: T ): T {
    return x;
  }

  export
  function plus1( x: number ): number {
    return x + 1;
  }

  export
  function sum() {
    var s = arguments[0];
    for (var i = 1, l = arguments.length; i < l; ++i) {
      s+= arguments[i];
    }
    return s;
  }

  export
  function diff() {
    var s = arguments[0];
    for (var i = 1, l = arguments.length; i < l; ++i) {
      s-= arguments[i];
    }
    return s;
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
    pm.addComponents( ctx );
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
    pm.addComponents( ctx );
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
    pm.addComponents( ctx );
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
    pm.addComponents( ctx );
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
    pm.addComponents( ctx );
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
    pm.addComponents( ctx );
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
    pm.addComponents( ctx );
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

    var ctx1: any = new m.Context();
    m.Context.construct( ctx1, spec );

    var ctx2: any = new m.Context();
    m.Context.construct( ctx2, spec );

    var ctx3: any = new m.Context();
    m.Context.construct( ctx3, spec );

    var pm = new s.PropertyModel
    pm.addComponents( ctx1, ctx2, ctx3 );
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

}
