module hd.qunit {

  module( "hd.utility" );

  import u = hd.utility;
  import aset = hd.utility.arraySet;
  import sset = hd.utility.stringSet;

  class Foo { };
  class Bar { };

  test( "helpers", function() {

    var t = {a: 3, b: [4, 5, {m: 100}], c: {x: 7, y: [8, 9]}};

    var u1 = u.shallowCopy( t );
    deepEqual( t, u1, "shallowCopy makes a copy" );
    strictEqual( t.b, u1.b, "shallowCopy leaves references alone" );
    strictEqual( t.c, u1.c, "shallowCopy leaves references alone" );

    var v = u.deepCopy( t );
    deepEqual( t, u1, "deepCopy makes a copy" );
    notStrictEqual( t.b, v.b, "deepCopy copies references" );
    notStrictEqual( t.c, v.c, "deepCopy copies references" );
    notStrictEqual( t.b[2], v.b[2], "deepCopy copies references" );
    notStrictEqual( t.c.y, v.c.y, "deepCopy copies references" );
    v.b.push( 7 );
    equal( v.b.length, 4, "deepCopy arrays still behave as arrays" );
    v.b[9] = 8;
    equal( v.b.length, 10, "deepCopy arrays still behave as arrays" );
    v.c.y[9] = 8;
    equal( v.c.y.length, 10, "deepCopy arrays still behave as arrays" );


    var t2 = [1, 2, -3, 4, -5, -6];
    var u2 = u.partition( t2, function( x: number ) { return x >= 0 ? 'a' : 'b' } );
    deepEqual( u2, {a: [1, 2, 4], b: [-3, -5, -6]}, "partition works" );

    var f = new Foo();
    strictEqual( u.isType( Foo )( f ), true, "isType works" );
    strictEqual( u.isType( Bar )( f ), false, "isType works" );
    strictEqual( u.isNotType( Foo )( f ), false, "isNotType works" );
    strictEqual( u.isNotType( Bar )( f ), true, "isNotType works" );

    var g = {a: 3, b: 4};
    strictEqual( u.nameIsIn( g )( 'a' ), true, "nameIsIn works" );
    strictEqual( u.nameIsIn( g )( 'c' ), false, "nameIsIn works" );
    strictEqual( u.nameIsNotIn( g )( 'a' ), false, "nameIsNotIn works" );
    strictEqual( u.nameIsNotIn( g )( 'c' ), true, "nameIsNotIn works" );

  } );

  asyncTest( "schedule", function() {
    expect( 8 );

    var count = 0;

    u.schedule( 3, function() {
      equal( count, 6, "all scheduled tasks ran" );
      start();
    } );

    u.schedule( 0, function() {
      ++count;
      equal( count, 2, "scheduled tasks run in the correct order" );
    } );

    u.schedule( 1, function() {
      ++count;
      equal( count, 5, "scheduled tasks run in the correct order" );
    } );

    u.schedule( 0, function() {
      ++count;
      equal( count, 3, "scheduled tasks run in the correct order" );
    } );

    u.schedule( 0, function() {
      ++count;
      equal( count, 4, "scheduled tasks run in the correct order" );
    } );

    u.schedule( 1, function() {
      ++count;
      equal( count, 6, "scheduled tasks run in the correct order" );
    } );

    u.schedule( -1, function() {
      ++count;
      equal( count, 1, "scheduled tasks run in the correct order" );
    } );

    equal( count, 1, "negative priority runs synchronously" );

  } );

  test( "arraysets", function() {
    var xs: u.ArraySet<number> = [2, 4, 6, 8];

    ok( aset.contains( xs, 6 ), "contains tests for membership" );
    ok( ! aset.contains( xs, 5 ), "set does not contain missing elements" );
    ok( aset.add( xs, 5 ), "add new element" );
    ok( aset.contains( xs, 5 ), "set contains added element" );
    ok( ! aset.add( xs, 4 ), "adding element already present returns false" );
    ok( ! aset.remove( xs, 7 ), "removing element not present returns false" );
    ok( aset.remove( xs, 4 ), "removing element" );
    ok( ! aset.contains( xs, 4 ), "set does not contain removed element" );

    deepEqual( aset.clone( xs ), xs, "clone makes copy" );

    xs = [2, 4, 6];
    ok( aset.areEqual( xs, [6, 2, 4] ), "set equal" );
    ok( ! aset.areEqual( xs, [2, 4] ), "set not equal" );
    ok( ! aset.areEqual( xs, [2, 4, 6, 8] ), "set not equal" );
    ok( ! aset.areEqual( xs, [6, 2, 6] ), "set not equal" );
    ok( aset.areDisjoint( xs, [3, 5, 7] ), "set disjoint" );
    ok( ! aset.areDisjoint( xs, [6, 8] ), "set not disjoint" );
    ok( ! aset.areDisjoint( xs, [3, 5, 7, 2] ), "set not disjoint" );

    var ys: u.ArraySet<number> = [4, 6, 8];

    deepEqual( aset.union( xs, ys ), [2, 4, 6, 8], "set union" );
    deepEqual( aset.intersect( xs, ys ), [4, 6], "set intersection" );
    deepEqual( aset.difference( xs, ys ), [2], "set difference" );
  } );

  test( "stringsets", function() {
    var xs: u.StringSet = {a: true, b: true, c: true};

    ok( sset.contains( xs, 'c' ), "contains tests for membership" );
    ok( ! sset.contains( xs, 'd' ), "set does not contain missing elements" );
    ok( sset.add( xs, 'd' ), "add new element" );
    ok( sset.contains( xs, 'd' ), "set contains added element" );
    ok( ! sset.add( xs, 'b' ), "adding element already present returns false" );
    ok( ! sset.remove( xs, 'e' ), "removing element not present returns false" );
    ok( sset.remove( xs, 'b' ), "removing element" );
    ok( ! sset.contains( xs, 'b' ), "set does not contain removed element" );

    deepEqual( sset.clone( xs ), xs, "clone makes copy" );
  } );

  test( "queue", function() {
    var q = new u.Queue();

    ok( q instanceof u.Queue, "created a queue" );
    ok( q.isEmpty(), "queue created empty" );
    ok( ! q.isNotEmpty(), "queue created empty" );

    q.enqueue( 2 );
    q.enqueue( 4 );
    q.enqueue( 6 );
    ok( ! q.isEmpty(), "queue not empty" );
    ok( q.isNotEmpty(), "queue not empty" );

    equal( q.dequeue(), 2, "dequeue in correct order" );
    ok( q.isNotEmpty(), "queue not empty" );
    equal( q.dequeue(), 4, "dequeue in correct order" );
    ok( q.isNotEmpty(), "queue not empty" );
    equal( q.dequeue(), 6, "dequeue in correct order" );
    ok( q.isEmpty(), "queue empty" );

  } );

  test( "heap", function() {
    var h = new u.Heap<number>( function(a: number, b: number) { return a > b; } );

    h.push( 10 );
    h.push( 5 );
    h.push( 15 );
    h.push( 20 );
    h.push( 3 );
    h.push( 5 );
    h.push( 18 );

    equal( h.length, 7, "length correct" );

    equal( h.pop(), 20, "popped maximum value" );
    equal( h.pop(), 18, "popped maximum value" );
    equal( h.pop(), 15, "popped maximum value" );
    equal( h.pop(), 10, "popped maximum value" );

    equal( h.length, 3, "length correct" );

    h.push( 4 );
    h.push( 7 );
    h.push( 1 );

    equal( h.length, 6, "length correct" );

    equal( h.pop(), 7, "popped maximum value" );
    equal( h.pop(), 5, "popped maximum value" );
    equal( h.pop(), 5, "popped maximum value" );
    equal( h.pop(), 4, "popped maximum value" );
    equal( h.pop(), 3, "popped maximum value" );
    equal( h.pop(), 1, "popped maximum value" );

    equal( h.length, 0, "length correct" );

  } );

}