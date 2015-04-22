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
    expect( 3 );

    var xinit = 3;
    var xupdate = 6;
    var yinit = new Date( "March 7, 1986" );
    var yupdate = new Date( "August 28, 1993" );
    var yupdate2 = new Date( "August 28, 1993" );

    var o: any = {};
    o.x = new r.ObservableProperty<number>( xinit );
    o.y = new r.ObservableProperty<Date>( yinit, datesEqual );

    var xcount = 0;
    o.x.addObserverInit( null,
      function( n: number ) {
        switch (++xcount) {
        case 1:
          equal( n, xinit, "received x initial value" );
          o.x.set( xupdate );
          break;
        case 2:
          equal( n, xupdate, "received x update value" );
          o.x.set( xupdate );
          break;
        default:
          ok( false, "received extra values" );
        }
      },
      null, null
    );

    var ycount = 0;
    o.y.addObserver( null,
      function( d: Date ) {
        switch (++ycount) {
        case 1:
          equal( d, yupdate, "received y update value" );
          o.y.set( yupdate2 );
          break;
        default:
          ok( false, "received extra values" );
        }
      },
      null, null
    );

    o.y.set( yinit );
    o.y.set( yupdate );

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
      function( n: number ) {
        equal( ++count, 1, "stabilizer only notified once" );
        equal( n, 10, "stabilizer received correct value" );
        hd.utility.schedule( 1, function() { start(); } );
      },
      function( n: number ) {
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
          .then( function( n3: number ) {

            equal( n3, 5, "promise pass-through worked" );
            throw 6;
            return -6;

          } )
          .then( function( n4: number ) {
            ok( false, "exception did not skip then" );
            return -6;
          } )
          .catch( function( n4: number ) {

            equal( n4, 6, "exception pass-through worked" );
            throw 7;
            return -7;

          } )
            .catch<number>( function( n5: number ) {

              equal( n5, 7, "exception to exception worked" );
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

  // asyncTest( "ladder", function() {
  //   expect( 8 );

  //   var ladder = new r.PromiseLadder<number>( 4 );
  //   ok( ladder.isSettled(), "Ladder created with fulfilled promise" );

  //   var count = 0;
  //   ladder.addObserver( null,
  //     function( n: number ) {
  //       switch (++count) {
  //       case 1:
  //         equal( n, 11, "First value correct" );
  //         break;
  //       case 2:
  //         equal( n, 12, "Second value correct" );
  //         break;
  //       case 3:
  //         equal( n, 14, "Third value correct" );
  //         break;
  //       default:
  //         ok( false, "Too many values" );
  //       }
  //     },
  //     null, null
  //   );

  //   var p1 = new r.Promise<number>();
  //   var p2 = new r.Promise<number>();
  //   var p3 = new r.Promise<number>();
  //   var p4 = new r.Promise<number>();
  //   var p5 = new r.Promise<number>();
  //   ladder.addPromise( p1 );
  //   ladder.addPromise( p2 );
  //   ladder.addPromise( p3 );
  //   strictEqual( ladder.currentPromise(), p3, "Current promise correct" );
  //   ladder.addPromise( p4 );
  //   ladder.addPromise( p5 );
  //   strictEqual( ladder.currentPromise(), p5, "Current promise correct" );

  //   ok( ! ladder.isSettled(), "Ladder has promises" );

  //   p1.resolve( 11 );
  //   p3.resolve( 12 );
  //   p2.resolve( 13 );
  //   p5.resolve( 14 );
  //   p4.resolve( 15 );

  //   hd.utility.schedule( 3, function() {
  //     equal( count, 3, "Correct number of notifications" );
  //     start();
  //   } );

  // } );

  asyncTest( "lifting functions", function() {
    expect( 8 );

    var lifted1 =
          r.liftFunction( function( a: number, b: number ) {
            return a + b;
          } );

    var lifted2 =
          r.liftFunction( function( a: number, b: number ) {
            return [a + b, a * b];
          }, 2 );

    ok( typeof lifted1 === 'function' &&
        typeof lifted2 === 'function'   , "Lifting produces a function" );

    var a = new r.Promise<number>();
    var b = new r.Promise<number>();
    var c = lifted1( a, b );
    var ds = lifted2( a, b );

    ok( c instanceof r.Promise, "Lifted function return promise" );
    ok( Array.isArray( ds ), "Lifted function with multiple outputs returned array" );
    ok( ds.length == 2, "Array was of length 2" );
    ok( ds[0] instanceof r.Promise &&
        ds[1] instanceof r.Promise   , "Array contained promises" );

    c.then( function( n: number ) {
      equal( n, 5, "Lifted function produced correct value" );
    } );

    ds[0].then( function( n: number ) {
      equal( n, 5, "Lifted function first output correct value" );
    } );

    ds[1].then( function( n: number ) {
      equal( n, 6, "Lifted function second output correct value" );
    } );

    a.resolve( 2 );
    b.resolve( 3 );

    hd.utility.schedule( 4, function() {
      start();
    } );

  } );

}