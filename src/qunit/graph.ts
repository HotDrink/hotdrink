module hd.qunit {

  module( "hd.graph" );

  // import Graph         = hd.graph.Graph;
  // import GraphWalker   = hd.graph.GraphWalker;
  import Digraph       = hd.graph.Digraph;
  import DigraphWalker = hd.graph.DigraphWalker;

  interface Graphish {
    addNode( id: string ): void;
    addEdge( from: string, to: string ): void;
  }

  function initGraph( g: Graphish ) {
    ['a', 'b', 'c', 'd', 'e'].forEach( g.addNode, g );
    g.addEdge( 'a', 'c' );
    g.addEdge( 'b', 'c' );
    g.addEdge( 'c', 'e' );
    g.addEdge( 'd', 'e' );
  }

  // test( "graph", function() {

  //   var g = new Graph();
  //   ok( g instanceof Graph, "created a new graph" );

  //   initGraph( g );

  //   ok( g.hasNode( 'a' ), "graph has expected nodes" );
  //   ok( g.hasNode( 'b' ), "graph has expected nodes" );
  //   ok( g.hasNode( 'd' ), "graph has expected nodes" );
  //   ok( g.hasNode( 'd' ), "graph has expected nodes" );
  //   ok( g.hasNode( 'e' ), "graph has expected nodes" );
  //   ok( ! g.hasNode( 'f' ), "graph does not have unexpected nodes" );

  //   ok( g.hasEdge( 'a', 'c' ), "graph has expected edges" );
  //   ok( g.hasEdge( 'b', 'c' ), "graph has expected edges" );
  //   ok( g.hasEdge( 'c', 'e' ), "graph has expected edges" );
  //   ok( g.hasEdge( 'd', 'e' ), "graph has expected edges" );
  //   ok( g.hasEdge( 'c', 'a' ), "graph edges go both ways" );
  //   ok( g.hasEdge( 'c', 'b' ), "graph edges go both ways" );
  //   ok( g.hasEdge( 'e', 'c' ), "graph edges go both ways" );
  //   ok( g.hasEdge( 'e', 'd' ), "graph edges go both ways" );
  //   ok( ! g.hasEdge( 'a', 'b' ), "graph does not have unexpected edges" );
  //   ok( ! g.hasEdge( 'a', 'e' ), "graph does not have unexpected edges" );
  //   ok( ! g.hasEdge( 'c', 'd' ), "graph does not have unexpected edges" );
  //   ok( ! g.hasEdge( 'b', 'd' ), "graph does not have unexpected edges" );
  //   ok( ! g.hasEdge( 'b', 'f' ), "graph does not have unexpected edges" );

  //   g.removeEdge( 'b', 'c' );
  //   ok( ! g.hasEdge( 'b', 'c' ), "removing edge works" );
  //   ok( ! g.hasEdge( 'c', 'b' ), "removing edge works" );
  //   ok( g.hasNode( 'b' ), "removing edge does not affect nodes" );
  //   ok( g.hasNode( 'c' ), "removing edge does not affect nodes" );
  //   ok( g.hasEdge( 'a', 'c' ), "removing one edge does not affect others" );
  //   ok( g.hasEdge( 'c', 'e' ), "removing one edge does not affect others" );

  //   g.removeNode( 'c' );
  //   ok( ! g.hasNode( 'c' ), "removing edge works" );
  //   ok( ! g.hasEdge( 'a', 'c' ), "removing node removes node's edges" );
  //   ok( ! g.hasEdge( 'c', 'e' ), "removing node removes node's edges" );
  //   ok( g.hasNode( 'a' ), "removing node does not affect others" );
  //   ok( g.hasNode( 'e' ), "removing node does not affect others" );
  //   ok( g.hasEdge( 'd', 'e' ), "removing node does not affect other edges" );

  // } );


  test( "digraph", function() {

    var g = new Digraph();
    ok( g instanceof Digraph, "created a new graph" );

    initGraph( g );

    ok( g.hasNode( 'a' ), "graph has expected nodes" );
    ok( g.hasNode( 'b' ), "graph has expected nodes" );
    ok( g.hasNode( 'd' ), "graph has expected nodes" );
    ok( g.hasNode( 'd' ), "graph has expected nodes" );
    ok( g.hasNode( 'e' ), "graph has expected nodes" );
    ok( ! g.hasNode( 'f' ), "graph does not have unexpected nodes" );

    ok( g.hasEdge( 'a', 'c' ), "graph has expected edges" );
    ok( g.hasEdge( 'b', 'c' ), "graph has expected edges" );
    ok( g.hasEdge( 'c', 'e' ), "graph has expected edges" );
    ok( g.hasEdge( 'd', 'e' ), "graph has expected edges" );
    ok( ! g.hasEdge( 'c', 'a' ), "graph edges do not go both ways" );
    ok( ! g.hasEdge( 'c', 'b' ), "graph edges do not go both ways" );
    ok( ! g.hasEdge( 'e', 'c' ), "graph edges do not go both ways" );
    ok( ! g.hasEdge( 'e', 'd' ), "graph edges do not go both ways" );
    ok( ! g.hasEdge( 'a', 'b' ), "graph does not have unexpected edges" );
    ok( ! g.hasEdge( 'a', 'e' ), "graph does not have unexpected edges" );
    ok( ! g.hasEdge( 'c', 'd' ), "graph does not have unexpected edges" );
    ok( ! g.hasEdge( 'b', 'd' ), "graph does not have unexpected edges" );
    ok( ! g.hasEdge( 'b', 'f' ), "graph does not have unexpected edges" );

    g.removeEdge( 'b', 'c' );
    ok( ! g.hasEdge( 'b', 'c' ), "removing edge works" );
    ok( ! g.hasEdge( 'c', 'b' ), "removing edge works" );
    ok( g.hasNode( 'b' ), "removing edge does not affect nodes" );
    ok( g.hasNode( 'c' ), "removing edge does not affect nodes" );
    ok( g.hasEdge( 'a', 'c' ), "removing one edge does not affect others" );
    ok( g.hasEdge( 'c', 'e' ), "removing one edge does not affect others" );

    g.removeNode( 'c' );
    ok( ! g.hasNode( 'c' ), "removing edge works" );
    ok( ! g.hasEdge( 'a', 'c' ), "removing node removes node's edges" );
    ok( ! g.hasEdge( 'c', 'e' ), "removing node removes node's edges" );
    ok( g.hasNode( 'a' ), "removing node does not affect others" );
    ok( g.hasNode( 'e' ), "removing node does not affect others" );
    ok( g.hasEdge( 'd', 'e' ), "removing node does not affect other edges" );

  } );

  // test( "graph walker", function() {
  //   var g = new Graph();
  //   initGraph( g );

  //   var nodes = new GraphWalker( g ).nodesReachable( 'c' );
  //   deepEqual( nodes, ['c', 'a', 'b', 'e', 'd'], "nodes in correct order" );

  //   nodes = new GraphWalker( g ).nodesReachable( 'd' );
  //   deepEqual( nodes, ['d', 'e', 'c', 'a', 'b'], "nodes in correct order" );

  //   nodes = new GraphWalker( g ).nodesReachable( 'a' );
  //   deepEqual( nodes, ['a', 'c', 'b', 'e', 'd'], "nodes in correct order" );

  //   nodes = new GraphWalker( g ).nodesReachableSameType( 'a' );
  //   deepEqual( nodes, ['a', 'b', 'e'], "same type" );

  //   nodes = new GraphWalker( g ).nodesReachableOtherType( 'a' );
  //   deepEqual( nodes, ['c', 'd'], "other type" );
  // } );

  test( "digraph walker", function() {
    var g = new Digraph();
    initGraph( g );

    var nodes = new DigraphWalker( g ).nodesDownstream( 'c' );
    deepEqual( nodes, ['c', 'e'], "downstream in correct order" );

    nodes = new DigraphWalker( g ).nodesUpstream( 'c' );
    deepEqual( nodes, ['c', 'a', 'b'], "upstream in correct order" );

    nodes = new DigraphWalker( g ).nodesDownstream( 'e' );
    deepEqual( nodes, ['e'], "downstream in correct order" );

    nodes = new DigraphWalker( g ).nodesUpstream( 'e' );
    deepEqual( nodes, ['e', 'c', 'a', 'b', 'd'], "updstream in correct order" );

    nodes = new DigraphWalker( g ).nodesDownstream( 'a' );
    deepEqual( nodes, ['a', 'c', 'e'], "downstream in correct order" );

    nodes = new DigraphWalker( g ).nodesUpstream( 'a' );
    deepEqual( nodes, ['a'], "downstream in correct order" );

    nodes = new DigraphWalker( g ).nodesDownstream( ['b', 'd'] );
    deepEqual( nodes, ['b', 'c', 'e', 'd'], "multiple starting points" );

    nodes = new DigraphWalker( g ).nodesDownstreamSameType( 'a' );
    deepEqual( nodes, ['a', 'e'], "downstream same type" );

    nodes = new DigraphWalker( g ).nodesDownstreamOtherType( 'a' );
    deepEqual( nodes, ['c'], "downstream other type" );

    nodes = new DigraphWalker( g ).nodesUpstreamSameType( 'e' );
    deepEqual( nodes, ['e', 'a', 'b'], "upstream same type" );

    nodes = new DigraphWalker( g ).nodesUpstreamOtherType( 'e' );
    deepEqual( nodes, ['c', 'd'], "downstream other type" );
  } );

}