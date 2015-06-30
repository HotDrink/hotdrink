module hd.qunit {

  module( "hd.reactive" );

  import u = hd.utility;
  import r = hd.reactive;

  export const
  enum E { next, error, completed }

  export
  class Result {
    event: E;
    value: any;
    error: any;
    cb: Function;

    constructor( event: E, arg?: any, cb?: Function ) {
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

  export
  class ObservableTest {
    constructor( public expected: any[] ) { }

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
          equal( value, expecting.value, "next received expected value " + expecting.value );
        }
        if (expecting.cb) {
          expecting.cb();
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
          equal( error, expecting.error, "next received expected error " + expecting.error );
        }
        if (expecting.cb) {
          expecting.cb();
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
        if (expecting.cb) {
          expecting.cb();
        }
      }
    }
  }

  function makeForwardTest( ladder: r.PromiseLadder<string>, results: [Result] ) {
    var p = new r.Promise<string>();
    ladder.addPromise( p );
    ladder.forwardPromise( new r.Promise<string>() ).addObserver( new ObservableTest( results ) );
    return p;
  }

  asyncTest( "promise ladder", function() {

    expect( 55 );

    var ladder = new r.PromiseLadder<string>();
    ok( ladder.isSettled(), "Ladder created with fulfilled promise" );

    var ps: r.Promise<string>[] = [];

    /* For testing, we add fourteen promises to the ladder.  This table shows a
     * timeline for how those promises are resolved, as well as the expected
     * output for a promise forwarded from each of these, and the expected
     * output for the ladder as a whole.
     *
     * X = failed, XX = rejected
     * ========================================================================================================|  => A, XX, C, D, F, null, I, H
     * 14: |    |    |    |    |    |    |    |    |    |    |    |    |    |    | X  |    |    |    |    |    |  => F, I, H
     * 13: |    |    |    |    |    |    |    |    |    |    |    | F* |    |    |    |    |    | X  |    |    |  => F, I, H
     * 12: |    |    |    |    |    |    |    |    | D* |    |    |    |    | G* |    |    | I* |    |    | X  |  => D, G, I, H
     * 11: |    |    |    |    |    |    |    | C* |    |    |    |    |    |    |    | H  |    |    |    |    |  => C, H
     * 10: |    |    |    |    |    |    |    |    |    |    | E  |    |    |    |    |    |    |    |    |    |  => E
     *  9: |    |    |    |    |    |    | X  |    |    |    |    |    |    |    |    |    |    |    |    |    |  => XX
     *  8: |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    | X  |    |  => XX
     *  7: |    |    |    |    |    |    |    |    |    |    |    |    | X  |    |    |    |    |    |    |    |  => XX
     *  6: |    |    |    |    |    | XX |    |    |    |    |    |    |    |    |    |    |    |    |    |    |  => XX
     *  5: |    |    |    |    | X  |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |  => A
     *  4: |    |    |    |    |    |    |    |    |    | X  |    |    |    |    |    |    |    |    |    |    |  => A
     *  3: |    |    | X  |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |  => A
     *  2: | X  |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |  => A
     *  1: |    | A  |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |  => A
     *  0: |    |    |    | B  |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |  => B
     */


    ps[0] = makeForwardTest( ladder, [new Result( E.next, "B" ),
                                      new Result( E.completed )
                                     ]
                           );
    strictEqual( ladder.getCurrentPromise(), ps[0], "Promise added to ladder" );

    ps[1] = makeForwardTest( ladder, [new Result( E.next, "A" ),
                                      new Result( E.completed )
                                     ]
                           );
    strictEqual( ladder.getCurrentPromise(), ps[1], "Promise added to ladder" );

    ps[2] = makeForwardTest( ladder, [new Result( E.next, "A" ),
                                      new Result( E.completed )
                                     ]
                           );

    ps[3] = makeForwardTest( ladder, [new Result( E.next, "A" ),
                                      new Result( E.completed )
                                     ]
                           );

    ps[4] = makeForwardTest( ladder, [new Result( E.next, "A" ),
                                      new Result( E.completed )
                                     ]
                           );

    ps[5] = makeForwardTest( ladder, [new Result( E.next, "A" ),
                                      new Result( E.completed )
                                     ]
                           );
    strictEqual( ladder.getCurrentPromise(), ps[5], "Promise added to ladder" );

    ps[6] = makeForwardTest( ladder, [new Result( E.error, "BAD" ),
                                      new Result( E.completed )
                                     ]
                           );

    ps[7] = makeForwardTest( ladder, [new Result( E.error, "BAD" ),
                                      new Result( E.completed )
                                     ]
                           );

    ps[8] = makeForwardTest( ladder, [new Result( E.error, "BAD" ),
                                      new Result( E.completed )
                                     ]
                           );

    ps[9] = makeForwardTest( ladder, [new Result( E.error, "BAD" ),
                                      new Result( E.completed )
                                     ]
                           );

    ps[10] = makeForwardTest( ladder, [new Result( E.next, "E" ),
                                       new Result( E.completed )
                                      ]
                            );
    strictEqual( ladder.getCurrentPromise(), ps[10], "Promise added to ladder" );

    ps[11] = makeForwardTest( ladder, [new Result( E.next, "C" ),
                                       new Result( E.next, "H" ),
                                       new Result( E.completed )
                                      ]
                            );

    ps[12] = makeForwardTest( ladder, [new Result( E.next, "D" ),
                                       new Result( E.next, "G" ),
                                       new Result( E.next, "I" ),
                                       new Result( E.next, "H" ),
                                       new Result( E.completed )
                                      ]
                            );

    ps[13] = makeForwardTest( ladder, [new Result( E.next, "F" ),
                                       new Result( E.next, "I" ),
                                       new Result( E.next, "H" ),
                                       new Result( E.completed )
                                      ]
                            );

    ps[14] = makeForwardTest( ladder, [new Result( E.next, "F" ),
                                       new Result( E.next, "I" ),
                                       new Result( E.next, "H" ),
                                       new Result( E.completed )
                                      ]
                            );
    strictEqual( ladder.getCurrentPromise(), ps[14], "Promise added to ladder" );

    ok( ! ladder.isSettled(), "Ladder has pending promises" );

    ladder.addObserver( new ObservableTest( [new Result( E.next, "A" ),
                                             new Result( E.error, "BAD" ),
                                             new Result( E.next, "C" ),
                                             new Result( E.next, "D" ),
                                             new Result( E.next, "F" ),
                                             new Result( E.error, null ),
                                             new Result( E.next, "I" ),
                                             new Result( E.next, "H" )
                                            ]
                                          )
                      );

    // All observers set up, so away we go...
    ps[ 2].reject();
    ps[ 1].resolve( "A" );
    ps[ 3].reject();
    ps[ 0].resolve( "B" );
    ps[ 5].reject();
    ps[ 6].reject( "BAD" );
    ps[ 9].reject();
    ps[11].notify( "C" );
    ps[12].notify( "D" );
    ps[ 4].reject();
    ps[10].resolve( "E" );
    ps[13].notify( "F" );
    ps[ 7].reject();
    ps[12].notify( "G" );
    ps[14].reject();
    ps[11].resolve( "H" );
    ps[12].notify( "I" );
    ps[13].reject();
    ps[ 8].reject();
    ps[12].reject();


    u.schedule( 3, function() {
      equal( ps[14], ladder.getCurrentPromise(), "Failed promise remained on top of ladder" );
      ok( ladder.isSettled(), "Ladder has no pending promises" );
      start();
    } );
  } )
}
