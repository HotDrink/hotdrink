module hd.qunit {

  module( "hd.reactive" );

  import r = hd.reactive;

  asyncTest( "basic observable", function() {
    expect( 8 );

    var count = 0;

    var o = new r.BasicObservable();

    ok( ! o.hasObservers(), "created without any observers" );

    o.addObserver( null,
      function( n: number ) {
        strictEqual( n, 5, "received next notification" );
        equal( ++count, 1, "notifications in correct order" );
      },
      function( n: number ) {
        strictEqual( n, 7, "received error notification" );
        equal( ++count, 2, "notifications in correct order" );
      },
      function() {
        ok( true, "received completed notification" );
        equal( ++count, 3, "notifications in correct order" );
        start();
      }
    );

    ok( o.hasObservers(), "has observers after subscribing" );

    o.sendNext( 5 );
    o.sendError( 7 );
    o.sendCompleted();
  } );

  function datesEqual( d: Date, e: Date ): boolean {
    return (!d && !e) || (d && e && d.getTime() == e.getTime());
  }

  asyncTest( "observable property", function() {
    expect( 4 );

    var xinit = 3;
    var xupdate = 6;
    var yinit = new Date( "March 7, 1986" );
    var yupdate = new Date( "August 28, 1993" );
    var yupdate2 = new Date( "August 28, 1993" );

    var o: any = {};
    o.x = new r.ScheduledSignal<number>( xinit );
    o.y = new r.ScheduledSignal<Date>( yinit, datesEqual );

    var xcount = 0;
    o.x.addObserver( null,
      function( n: number ) {
        switch (++xcount) {
        case 1:
          equal( n, xinit, "received x initial value" );
          o.x.set( xupdate );
          break;
        case 2:
          equal( n, xupdate, "received x update value" );
          break;
        default:
          ok( false, "received extra x values" );
        }
      },
      null, null
    );

    var ycount = 0;
    o.y.addObserver( null,
      function( d: Date ) {
        switch (++ycount) {
        case 1:
          equal( d, yinit, "received y initial value" );
          o.y.set( yinit );
          o.y.set( yupdate );
          break;
        case 2:
          equal( d, yupdate, "received y update value" );
          o.y.set( yupdate2 );
          break;
        default:
          ok( false, "received extra y values" );
        }
      },
      null, null
    );

    hd.utility.schedule( 4, function() {
      start();
    } );

  } );

  asyncTest( "extensions", function() {
    expect( 6 );

    var o: r.BasicObservable<any> = new r.BasicObservable<number>();
    var stabilizer = new r.Stabilizer( 100 );
    o.addObserver( stabilizer );
    var count = 0;
    stabilizer.addObserver( null,
      function( p: r.Promise<number> ) {
        equal( ++count, 1, "stabilizer only notified once" );
        p.then( function( n: number ) {
          equal( n, 10, "stabilizer received correct value" );
          hd.utility.schedule( 1, function() { start(); } );
        } );
      },
      function( e: any ) {
        ok( false, "stabilizer received error" );
      },
      null
    );
    o.sendNext( 6 );
    o.sendError( 8 );
    o.sendNext( 10 );

    var val: any = {a: 3, b: [4, 5, 6]};
    o = new r.BasicObservable<any>();
    var tojson = new r.ToJson();
    o.addObserver( tojson );
    tojson.addObserver( null,
      function( s: string ) {
        strictEqual( s, JSON.stringify( val ), "ToJson worked" );
      },
      null, null
    );
    o.sendNext( val );

    o = new r.BasicObservable<string>();
    var tonum = new r.ToNumber();
    o.addObserver( tonum );
    tonum.addObserver( null,
      function( n: number ) {
        strictEqual( n, 123, "StringToNumber worked" );
      },
      null, null
    );
    o.sendNext( "123" );

    o = new r.BasicObservable<string>();
    var todate = new r.ToDate();
    o.addObserver( todate );
    todate.addObserver( null,
      function( d: Date ) {
        ok( datesEqual( d, new Date( "March 3, 1933" ) ), "StringToDate worked" );
      },
      null, null
    );
    o.sendNext( "03-03-1933" );

    o = new r.BasicObservable<Date>();
    var tostring = new r.DateToDateString();
    o.addObserver( tostring );
    tostring.addObserver( null,
      function( s: string ) {
        equal( s, "3/3/1933", "DateToDateString worked" );
      },
      null, null
    );
    o.sendNext( new Date( "March 3, 1933" ) );

  } );

  asyncTest( "promise", function() {
    expect( 7 );

    var p = new r.Promise<number>();

    p.then( function( n1: number ) {

      equal( n1, 3, "promise value received" );
      return 4;

    } )
          .then<number>( function( n2: number ) {

            equal( n2, 4, "then value received" );
            var p2 = new r.Promise<number>();
            hd.utility.schedule( 0, function() { p2.resolve( 5 ); } );
            return p2;

          } )
          .then( function( n3: number ): number {

            equal( n3, 5, "promise pass-through worked" );
            throw "Ignore: testing promise throwing (1)";

          } )
          .then( function( n4: number ) {
            ok( false, "exception did not skip then" );
            return -6;
          } )
          .catch( function( n4: number ) {

            equal( n4, "Ignore: testing promise throwing (1)", "exception pass-through worked" );
            throw "Ignore: testing promise throwing (2)";

          } )
            .catch<number>( function( n5: number ) {

              equal( n5, "Ignore: testing promise throwing (2)", "exception to exception worked" );
              var p3 = new r.Promise<number>();
              hd.utility.schedule( 0, function() { p3.resolve( 8 ); } );
              return p3;

            } )
          .catch( function( n6: number ) {
            ok( false, "regular execution entered catch" );
            return -8;
          } )
            .then( function( n6: number ) {

              equal( n6, 8, "then value received" );
              start();

            } );

    var q = new r.Promise<number>();

    q.then( function ( n1: number ) {

      equal( n1, 3, "promise value inherited" );

    } );

    q.resolve( p );

    q.resolve( -2 );

    p.resolve( 3 );

  } );

  asyncTest( "lifting functions", function() {
    expect( 11 );

    var lifted1 =
          r.liftFunction( function( a: number, b: number ) {
            return a + b;
          } );

    var lifted2 =
          r.liftFunction( function( a: number, b: number ) {
            return [a + b, a * b];
          } );

    ok( typeof lifted1 === 'function' &&
        typeof lifted2 === 'function'   , "Lifting produces a function" );

    var a = new r.Promise<number>();
    var b = new r.Promise<number>();
    var c = lifted1( a, b );
    var d = lifted2( a, b );

    ok( c instanceof r.Promise, "Lifted function return promise" );
    ok( d instanceof r.Promise, "Lifted function return promise" );

    c.then( function( n: number ) {
      equal( n, 5, "Lifted function produced correct value" );
    } );

    d.then( function( ns: number[] ) {
      ok( Array.isArray( ns ), "Lifted function produced an array" );
      equal( ns[0], 5, "Lifted function first output correct value" );
      equal( ns[1], 6, "Lifted function second output correct value" );
    } );

    a.resolve( 2 );
    b.resolve( 3 );

    var lifted3 =
          r.liftFunction( function( n: number, m: number ) {
            return n + m;
          } );

    var n = new r.Promise<number>();
    var m = new r.Promise<number>();
    var o = lifted3( n, m );
    var i = 0;

    o.then(
      function( n: number ) {
        equal( n, 12, "Lifted function produced correct value" );
      },
      null,
      function( n: number ) {
        switch (i++) {
        case 0: return equal( n, 7, "Lifted function produced correct notification" );
        case 1: return equal( n, 9, "Lifted function produced correct notification" );
        case 2: return equal( n, 11, "Lifted function produced correct notification" );
        }
      }
    );

    n.notify( 3 );
    m.notify( 4 );
    n.resolve( 5 );
    m.notify( 6 );
    m.resolve( 7 );

    hd.utility.schedule( 4, function() {
      start();
    } );

  } );

}
