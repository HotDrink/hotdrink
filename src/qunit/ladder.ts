module hd.qunit {

  module( "hd.reactive" );

  import u = hd.utility;
  import r = hd.reactive;

  enum E { next, error, completed }

  class Result {
    event: E;
    value: any;
    error: any;

    constructor( event: E, arg?: any ) {
      this.event = event;
      if (event === E.next) {
        this.value = arg;
      }
      else if (event === E.error) {
        this.error = arg;
      }
    }

    toString(): string {
      if (this.event === E.next) {
        return 'next(' + this.value + ')';
      }
      if (this.event === E.error) {
        return 'error(' + this.error + ')';
      }
      return 'completed()';
    }
  }

  class ObservableTest {
    constructor( public expected: any[],
                 public nextEq?: u.EqualityPredicate<any>,
                 public errorEq: u.EqualityPredicate<any> = blameEqual ) { }

    onNext( value: any ) {
      var received = new Result( E.next, value );
      if (this.expected.length == 0) {
        ok( false, "received " + received + " when no more events expected" );
      }
      else {
        var expecting = this.expected.shift();
        if (expecting.event != E.next) {
          ok( false, "received " + received + " when expecting " + expecting );
        }
        else {
          if (this.nextEq) {
            ok( this.nextEq( value, expecting.value ), "next received expected value" );
          }
          else {
            equal( value, expecting.value, "next received expected value" );
          }
        }
      }
    }

    onError( error: any ) {
      var received = new Result( E.error, error );
      if (this.expected.length == 0) {
        ok( false, "received " + received + " when no more events expected" );
      }
      else {
        var expecting = this.expected.shift();
        if (expecting.event != E.error) {
          ok( false, "received " + received + " when expecting " + expecting );
        }
        else {
          if (this.errorEq) {
            ok( this.errorEq( error, expecting.error ), "error received expected value" );
          }
          else {
            equal( error, expecting.error, "next received expected value" );
          }
        }
      }
    }

    onCompleted() {
      if (this.expected.length == 0) {
        ok( false, "received completed() when no more events expected" );
      }
      else {
        var expecting = this.expected.shift();
        ok( expecting.event == E.completed, "received expected completed" );
      }
    }
  }

  function blameEqual( b1: r.Blame, b2: r.Blame ): boolean {
    if (! (b1 instanceof r.Blame) ||
        ! (b2 instanceof r.Blame)   ) {
      return b1 == b2;
    }
    return (u.arraySet.areEqual( b1.promises, b2.promises ));
  }

  asyncTest( "promise ladder", function() {

    expect( 32 );

    var ladder = new r.PromiseLadder<number>( 4 );
    ok( ladder.isSettled(), "Ladder created with fulfilled prmoise" );

    var b = {
      a: new r.Promise<number>(),
      b: new r.Promise<number>(),
      c: new r.Promise<number>()
    };

    var ps: r.Promise<number>[] = [];

    ps[0] = new r.Promise<number>();
    ladder.addPromise( ps[0] );
    strictEqual( ladder.currentPromise(), ps[0], "Promise added to ladder" );
    var f = ladder.getForwardedPromise( [b.a, b.b] );
    f.addObserver( new ObservableTest( [{event: E.next, value: 8},
                                        {event: E.completed}
                                       ]
                                     )
                 );

    ps[1] = new r.Promise<number>();
    ladder.addPromise( ps[1] );
    f = ladder.getForwardedPromise( [b.a, b.b] );
    f.addObserver( new ObservableTest( [{event: E.next, value: 6},
                                        {event: E.next, value: 7},
                                        {event: E.next, value: 8},
                                        {event: E.completed}
                                       ]
                                     )
                 );
    f = ladder.getForwardedPromise( [b.a, b.c] );
    f.addObserver( new ObservableTest( [{event: E.next, value: 6},
                                        {event: E.next, value: 7},
                                        {event: E.error, error: new r.Blame( b.c )},
                                        {event: E.completed}
                                       ]
                                     )
                 );

    ps[2] = new r.Promise<number>();
    ladder.addPromise( ps[2] );
    strictEqual( ladder.currentPromise(), ps[2], "Promise added to ladder" );
    f = ladder.getForwardedPromise( [b.c] );
    f.addObserver( new ObservableTest( [{event: E.next, value: 5},
                                        {event: E.next, value: 6},
                                        {event: E.next, value: 7},
                                        {event: E.error, error: new r.Blame( b.c )},
                                        {event: E.completed}
                                       ]
                                     )
                 );
    f = ladder.getForwardedPromise( [b.b] );
    f.addObserver( new ObservableTest( [{event: E.next, value: 5},
                                        {event: E.error, error: new r.Blame( b.b )},
                                        {event: E.completed}
                                       ]
                                     )
                 );

    ps[3] = new r.Promise<number>();
    ladder.addPromise( ps[3] );
    f = ladder.getForwardedPromise( [b.a] );
    f.addObserver( new ObservableTest( [{event: E.error, error: new r.Blame( b.a )},
                                        {event: E.completed}
                                       ]
                                     )
                 );
    f = ladder.getForwardedPromise( [] );
    f.addObserver( new ObservableTest( [{event: E.next, value: 5},
                                        {event: E.next, value: 6},
                                        {event: E.next, value: 7},
                                        {event: E.next, value: 8},
                                        {event: E.completed}
                                       ]
                                     )
                 );

    ok( ! ladder.isSettled(), "Ladder has pending promises" );

    ladder.addObserver( new ObservableTest( [{event: E.next, value: 5},
                                             {event: E.next, value: 7},
                                             {event: E.next, value: 8}
                                            ]
                                          )
                      );

    ps[3].reject( new r.Blame( b.a ) );
    ps[2].notify( 5 );
    ps[1].notify( 6 );
    ps[2].reject( new r.Blame( b.a, b.b ) );
    ps[0].resolve( 8 );
    ps[1].reject( new r.Blame( b.c ) );

    u.schedule( 3, start );
  } )
}