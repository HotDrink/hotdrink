/********************************************************************\
 DISCLAIMER:  This is a mess.  I started with the project template
              from arbor.js and gradually lumped on bits and pieces
              from there.  Probably worth rewriting if we want to
              keep it.
\********************************************************************/

//
//  main.js
//
//  A project template for using arbor.js
//

var model;
var system;
var noop = hd.utility.noop;

(function($){

  var snap = true;
  var paused = false;
  var dragMoved = false;
  var hovering = null;
  var selected = {};
  var editing = null;
  var editBinding = null;
  var varBindings = [];
  var cgraph;
  var compplanner;
  var point;
  var connect = true;

  function isSelected( mid ) {
    if (compplanner) {
      return compplanner.selected == mid;
    }
    else {
      return system.sgraph &&
        system.sgraph.contains( mid );
    }
  }

  var Renderer = function(canvas){
    var canvas = $(canvas).get(0);
    var w = 24;
    var labelFont = 'italic ' + w + 'px "Latin Modern Roman","Times New Roman",Times,serif';
    var dataFont = w + 'px Arial,Helvetica,sans-serif';
    var ctx = canvas.getContext("2d");
    var particleSystem

    if (!ctx.setLineDash) {
      ctx.setLineDash = function() { }
    }

    var drawVariable = function( node, pt ) {
      var value = String( node.data.value.get() );
      var m = ctx.measureText( value );
      ctx.fillStyle = "white";
      ctx.fillRect( pt.x - m.width/2 - w/4, pt.y - 4*w/6 + 1, m.width + w/2, 4*w/3 );
      if (node === hovering) {
        ctx.strokeStyle = "blue";
        ctx.fillStyle = "blue";
      }
      else if (node === editing) {
        // ctx.strokeStyle = "green";
        // ctx.fillStyle = "green";
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
      }
      else {
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
      }
      ctx.strokeRect( pt.x - m.width/2 - w/4, pt.y - 4*w/6 + 1, m.width + w/2, 4*w/3 );
      ctx.font = dataFont;
      ctx.fillText( value, pt.x - m.width/2, pt.y - w/2 );
      //ctx.fillRect(pt.x-w/2, pt.y-w/2, w,w)
      ctx.font = labelFont;
      var m = ctx.measureText( node.data.label )
      if (node.data.flip) {
        ctx.fillText( node.data.label, pt.x - m.width/2, pt.y - 2*w );
      }
      else {
        ctx.fillText( node.data.label, pt.x - m.width/2, pt.y + w/2 );
      }
    };

    var that = {
      init:function(system){
        //
        // the particle system will call the init function once, right before the
        // first frame is to be drawn. it's a good place to set up the canvas and
        // to pass the canvas size to the particle system
        //
        // save a reference to the particle system for use in the .redraw() loop
        particleSystem = system

        // inform the system of the screen dimensions so it can map coords for us.
        // if the canvas is ever resized, screenSize should be called again with
        // the new dimensions
        particleSystem.screenSize(canvas.width, canvas.height)
        particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side

        // set up some event handlers to allow for node-dragging
        that.initMouseHandling()

        that.reload();
      },

      reload:function() {
        var sys = particleSystem;
        hd.utility.schedule( 5, function () {
          sys.prune( function() { return true; } );
          varBindings.forEach( function( b ) { hd.unbind( b ) } );
          varBindings = [];

          cgraph.variables().forEach( function( vid ) {
            var vv = system.variables[vid];
            sys.addNode( vid, {label: vv.name,
                               value: vv.value} );
            var binding = {view: { onNext: redraw, onError: noop, onCompleted: noop },
                           model: vv
                          };
            hd.bind( binding );
            varBindings.push( binding );
          } );
          cgraph.constraints().forEach( function( cid ) {
            if (hd.graph.isStayConstraint( cid )) { return }
            var first = null;
            var prev = null;
            cgraph.methodsForConstraint( cid ).forEach( function( mid ) {
              sys.addNode( mid, {isMethod: true, constraint: cid} );
              if (first === null) {
                first = prev = mid;
              }
              else {
                sys.addEdge( prev, mid, {length: -2.5} );
                prev = mid;
              }
              cgraph.inputsForMethod( mid ).forEach( function( vid ) {
                sys.addEdge( vid, mid );
              } );
              cgraph.outputsForMethod( mid ).forEach( function( vid ) {
                sys.addEdge( mid, vid );
              } );
            } );
            if (first !== prev) {
              sys.addEdge( prev, first, {length: -2.5} );
            }
          } );
          if (paused) {
            that.redraw();
          }
        } );
      },

      redraw:function(){
        //
        // redraw will be called repeatedly during the run whenever the node positions
        // change. the new positions for the nodes can be accessed by looking at the
        // .p attribute of a given node. however the p.x & p.y values are in the coordinates
        // of the particle system rather than the screen. you can either map them to
        // the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
        // which allow you to step through the actual node objects but also pass an
        // x,y point in the screen's coordinate system
        //
        ctx.fillStyle = "white"
        ctx.fillRect(0,0, canvas.width, canvas.height)

        if (paused && point) {
          ctx.strokeStyle = "black";
          ctx.fillStyle = "black";
          ctx.font = dataFont;
          ctx.fillText( point, 10, 10 );
        }

        // Draw lines between methods of the same constraint
        if (connect) {
          particleSystem.eachEdge(function(edge, pt1, pt2){
            if (edge.source.data.isMethod && edge.target.data.isMethod) {
              ctx.setLineDash( [] );
              //ctx.strokeStyle = "rgba(255, 153, 153, .667)"
              ctx.strokeStyle = "rgb(223, 223, 223)";
              ctx.lineWidth = 8
              ctx.beginPath()
              ctx.moveTo(pt1.x, pt1.y)
              ctx.lineTo(pt2.x, pt2.y)
              ctx.stroke()
              ctx.strokeStyle = "white"
              ctx.lineWidth = 2
              ctx.beginPath()
              ctx.moveTo(pt1.x, pt1.y)
              ctx.lineTo(pt2.x, pt2.y)
              ctx.stroke()
            }
          })
        }

        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords

          // draw a line from pt1 to pt2
          if (edge.source.data.isMethod && edge.target.data.isMethod) {
          }
          else {
            var method = null;
            if (edge.target.data.isMethod) {
              method = edge.target;
              ctx.setLineDash( [10, 5] )
            }
            else {
              ctx.setLineDash( [] );
              if (edge.source.data.isMethod) {
                method = edge.source;
              }
            }
            ctx.lineWidth = 2
            if (method === hovering) {
              if (isSelected( method.name ) ) {
                ctx.lineWidth = 5
              }
              ctx.strokeStyle = "blue"
            }
            else {
              var cid = method.data.constraint;
              if (selected === cid) {
                ctx.strokeStyle = "green";
              }
              else if (isSelected( method.name ) ) {
                ctx.lineWidth = 5
                ctx.strokeStyle = "black"
              }
              else {
                //ctx.strokeStyle = "rgb(191, 191, 191)";
                ctx.strokeStyle = "rgb(127, 127, 127)";
              }
            }
            ctx.beginPath()
            ctx.moveTo(pt1.x, pt1.y)
            ctx.lineTo(pt2.x, pt2.y)
            ctx.stroke()
          }
        })

        ctx.textBaseline = "top";
        ctx.lineWidth = 2

        particleSystem.eachNode(function(node, pt){
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords
          // draw a rectangle centered at pt
          var r;
          if (node.data.isMethod) {
            if (node === hovering) {
              ctx.fillStyle = "blue";
            }
            else if (selected === node.data.constraint) {
              ctx.fillStyle = "green";
            }
            else if (isSelected( node.name )) {
              ctx.fillStyle = "black";
            }
            else {
              ctx.fillStyle = "rgb(127, 127, 127)";
            }

            if (isSelected( node.name )) {
              r = w/2;
            }
            else {
              r = 2*w/5;
            }
            ctx.setLineDash( [] );
            ctx.beginPath();
            ctx.arc( pt.x, pt.y, r, 0, 6.3 )
            ctx.fill();
          }
          else {
            drawVariable( node, pt );
          }
        })
      },

      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        var dragged = null;

        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          moved:function(e) {
            if (!dragged) {
              var pos = $(canvas).offset();
              _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
              var over = particleSystem.nearest(_mouseP)

              if (over && over.node && over.distance < w) {
                if (hovering !== over.node) {
                  hovering = over.node
                  if (paused) {
                    that.redraw();
                  }
                }
              }
              else {
                if (hovering !== null) {
                  hovering = null;
                  if (paused) {
                    that.redraw();
                  }
                }
              }
            }
            return false;
          },
          clicked:function(e){
            hovering = null
            dragMoved = false;
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            dragged = particleSystem.nearest(_mouseP);

            if (dragged && dragged.node !== null){
              // while we're dragging, don't let physics move the node
              dragged.node.fixed = true
            }

            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            return false
          },
          dblclick:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            var clicked = particleSystem.nearest(_mouseP);
            if (clicked && clicked.node !== null) {
              var data = clicked.node.data;
              data.flip = !data.flip;
            }
          },
          dragged:function(e){
            dragMoved = true;
            var pos = $(canvas).offset();
            var x = e.pageX-pos.left;
            var y = e.pageY-pos.top;
            if (paused && snap) {
              x -= x % 10;
              y -= y % 10;
            }
            point = '(' + x + ', ' + y + ')';
            var s = arbor.Point(x, y)

            if (dragged && dragged.node !== null){
              var p = particleSystem.fromScreen(s)
              dragged.node.p = p
            }

            if (paused) {
              that.redraw();
            }

            return false
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return

            point = null;

            if (dragged.distance < w && ! dragMoved) {
              if (dragged.node.data.isMethod) {
                if (selected === dragged.node.data.constraint) {
                  selected = null;
                }
                else {
                  selected = dragged.node.data.constraint;
                }
                if (paused) {
                  hd.utility.schedule( 5, that.redraw, that );
                }
              }
              else {
                editing = dragged.node;
                if (editBinding) hd.unbind( editBinding );

                var vv = system.variables[dragged.node.name];
                document.getElementById( 'varname' ).firstChild.nodeValue =
                  vv.name;
                var txt = document.getElementById( 'varvalue' );
                editBinding = {view: new hd.Edit( txt ),
                               toModel: hd.toNum(),
                               model: vv
                              };
                hd.bind( editBinding );
                hd.utility.schedule( 3, function() { txt.select(); } );

                vv.onNext( vv.value.get() );
              }
            }

            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
          }
        }

        // start listening
        var foo = $(canvas).mousedown(handler.clicked).mousemove(handler.moved);
        foo.dblclick(handler.dblclick);

      },

    }

    system.solved.addObserver( {
      onNext: function( isSolved ) {
        if (isSolved && paused) {
          that.redraw();
        }
      }
    } );

    var redrawing = false;
    var redraw = function() {
      if (paused && !redrawing) {
        redrawing = true;
        hd.utility.schedule( 3, reallyRedraw );
      }
    };
    var reallyRedraw = function() {
      redrawing = false;
      that.redraw();
    }

    return that
  }

  var pieces = 0;

  var q = location.toString().lastIndexOf( '?' );
  if (q > -1) {
    var modelfile = location.toString().substring( q + 1 );
    if (! modelfile.match( /\.js$/)) {
      modelfile+= '.js';
    }
    var scriptTag = document.createElement( 'script' );
    scriptTag.onload = begin;
    scriptTag.src = '../models/' + modelfile;
    document.head.appendChild( scriptTag );
  }
  else {
    alert( 'Please put model name as query string' );
  }
  $(document).ready( begin );

  function begin(){
    if (++pieces < 2)  return;
    if (! system) {
      system = new hd.ConstraintSystem();
    }
    system.addComponent( model );

    cgraph = system.cgraph;
    var sys = arbor.ParticleSystem(1000, 600, 0.5, true) // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...

    // var observer = {
    //   onNext: function( event ) {
    //     switch (event.type) {
    //     case 'addVariable':
    //       var vv = event.variable;
    //       sys.addNode( vv.id, {label: vv.name} );
    //       break;
    //     case 'addModel':
    //       event.model.addObserver( observer );
    //     }
    //   }
    // };

    // hd.runtime.isUpdated.addObserver( {
    //   onNext: function( runtimeIsUpdated ) {


    $('#pause').click( function() {
      if (paused) {
        sys.start();
        this.firstChild.nodeValue = 'Pause';
        paused = false;
      }
      else {
        sys.stop();
        this.firstChild.nodeValue = 'Resume';
        paused = true;
      }
    } );

    $('#compose').click( function() {
      this.disabled = true;
      system.switchToNewPlanner( hd.plan.ComposedPlanner );
      system.update();
      compplanner = system.planner;
      cgraph = compplanner.compcgraph;
      sys.renderer.reload();
    } )

    $('#connect').click( function() {
      connect = this.checked;
      sys.renderer.redraw();
    } )

    // $('#snap').click( function() {
    //   snap = this.checked;
    // } )

    // add some nodes to the graph and watch it go...
    // sys.addEdge('a','b')
    // sys.addEdge('a','c')
    // sys.addEdge('a','d')
    // sys.addEdge('a','e')
    // sys.addNode('f', {alone:true, mass:.25})

/*
    sys.addNode( 'm1', {method: true} )
    sys.addNode( 'm2', {method: true} )
    sys.addNode( 'm3', {method: true} )
    sys.addNode( 'v1', {label: 'left'} )
    sys.addNode( 'v2', {label: 'right'} )
    sys.addNode( 'v3', {label: 'width'} )
    sys.addEdge( 'v1', 'm1' );
    sys.addEdge( 'v2', 'm1' );
    sys.addEdge( 'm1', 'v3' );
    sys.addEdge( 'v1', 'm2' )
    sys.addEdge( 'v3', 'm2' )
    sys.addEdge( 'm2', 'v2' )
    sys.addEdge( 'v2', 'm3' )
    sys.addEdge( 'v3', 'm3' )
    sys.addEdge( 'm3', 'v1' )
    sys.addEdge( 'm1', 'm2', {length: -2.5} )
    sys.addEdge( 'm1', 'm3', {length: -2.5} )
    sys.addEdge( 'm2', 'm3', {length: -2.5} )


    sys.addNode( 'm4', {method: true} )
    sys.addNode( 'm5', {method: true} )
    sys.addNode( 'm6', {method: true} )
    sys.addNode( 'v4', {label: 'height'} )
    sys.addNode( 'v5', {label: 'aspect'} )
    sys.addEdge( 'v3', 'm4' )
    sys.addEdge( 'v4', 'm4' )
    sys.addEdge( 'm4', 'v5' )
    sys.addEdge( 'v3', 'm5' )
    sys.addEdge( 'v5', 'm5' )
    sys.addEdge( 'm5', 'v4' )
    sys.addEdge( 'v4', 'm6' )
    sys.addEdge( 'v5', 'm6' )
    sys.addEdge( 'm6', 'v3' )
    sys.addEdge( 'm4', 'm5', {length: -2.5} )
    sys.addEdge( 'm5', 'm6', {length: -2.5} )
    sys.addEdge( 'm6', 'm4', {length: -2.5} )
*/

    // or, equivalently:
    //
    // sys.graft({
    //   nodes:{
    //     f:{alone:true, mass:.25}
    //   },
    //   edges:{
    //     a:{ b:{},
    //         c:{},
    //         d:{},
    //         e:{}
    //     }
    //   }
    // })

  }

})(this.jQuery)
