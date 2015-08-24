module hd.bindings {

  import u = hd.utility;
  import r = hd.reactive;
  import m = hd.model;

  function concat( as: (any|any[]), bs: (any|any[]) ): any[] {
    if (! as) {
      return bs;
    }
    if (! bs) {
      return as;
    }
    if (Array.isArray( as )) {
      if (Array.isArray( bs )) {
        return as.concat( bs );
      }
      else {
        return as.concat( [bs] );
      }
    }
    else {
      if (Array.isArray( bs )) {
        return [as].concat( bs );
      }
      else {
        return [as, bs];
      }
    }
  }

  export
  function edit<T>( target: Target,
                    toView?: r.Extension<T,string>,
                    toModel?: r.Extension<string,T> ): Binding {
    return {mkview: Edit,
            model: target,
            dir: Direction.bi,
            toView: toView,
            toModel: toModel
           };
  }

  export
  function editVar<T>( v: Target,
                       toView?: r.Extension<T,string>,
                       toModel?: r.Extension<string,T> ): (Binding|Binding[])[] {
    return [edit( v, toView, toModel ),
            cssClass( v ),
            enabled( (<m.Variable>v).relevant )
           ];
  }

  export
  function num( target: Target,
                places: number,
                toView?: r.Extension<any,number>,
                toModel?: r.Extension<number,any> ): Binding {
    if (places === undefined || places === null) {
      return {mkview: Edit,
              model: target,
              dir: Direction.bi,
              toView: toView,
              toModel: concat( new r.ToNumber(), toModel )
             };
    }
    else {
      return {mkview: Edit,
              model: target,
              dir: Direction.bi,
              toView: concat( toView, places >= 0 ? new r.NumberToFixed( places )
                                                  : new r.Round( places )
                            ),
              toModel: concat( [new r.ToNumber(), new r.Round( places )], toModel )
             };
    }
  }

  export
  function numVar( v: Target,
                   places: number,
                   toView?: r.Extension<any,number>,
                   toModel?: r.Extension<number,any> ): (Binding|Binding[])[] {
    return [num( v, places, toView, toModel ),
            cssClass( v ),
            enabled( (<m.Variable>v).relevant )
           ];
  }

  export
  function date( target: Target,
                 toView?: r.Extension<any,Date>,
                 toModel?: r.Extension<Date,any> ): Binding {
    return {mkview: Edit,
            model: target,
            dir: Direction.bi,
            toView: concat( toView, new r.DateToDateString() ),
            toModel: concat( new r.ToDate(), toModel )
           };
  }

  export
  function dateVar( v: Target,
                    toView?: r.Extension<any,Date>,
                    toModel?: r.Extension<Date,any> ): (Binding|Binding[])[] {
    return [date( v, toView, toModel ),
            cssClass( v ),
            enabled( (<m.Variable>v).relevant )
           ];
  }

  export
  function text( target: Target, toView?: r.Extension<any,string> ): Binding {
    return {mkview: Text,
            model: target,
            toView: toView,
            dir: Direction.m2v
           };
  }

  export
  function cssClass( o: Object,
                     ontrue?: string,
                     onfalse?: string,
                     toView?: r.Extension<any,boolean> ): Binding[] {
    if (ontrue || onfalse || !(o instanceof m.Variable)) {
      return [{mkview: CssClass.bind( null, ontrue, onfalse ),
               model: <Target>o,
               dir: Direction.m2v,
               toView: toView
              }
             ];
    }
    else {
      var vv = <m.Variable>o;
      return [{mkview: CssClass.bind( null, 'source', 'derived' ),
               model: vv.source,
               dir: Direction.m2v
              },
              {mkview: CssClass.bind( null, 'stale', 'current' ),
               model: vv.stale,
               dir: Direction.m2v
              },
              {mkview: CssClass.bind( null, 'pending', 'complete' ),
               model: vv.pending,
               dir: Direction.m2v
              },
              {mkview: CssClass.bind( null, 'contributing', 'noncontributing' ),
               model: vv.contributing,
               dir: Direction.m2v
              },
              {mkview: CssClass.bind( null, 'error', null ),
               model: vv.error,
               dir: Direction.m2v
              }
      ];
    }
  }

  export
  function enabled( target: Target,
                    toView?: r.Extension<any,boolean> ): Binding {
    return {mkview: Enabled,
            model: target,
            dir: Direction.m2v,
            toView: toView
           };
  }

  export
  function value( target: Target,
                  toView?: r.Extension<any,string>,
                  toModel?: r.Extension<string,any> ): Binding {
    return {mkview: Value,
            model: target,
            dir: Direction.bi,
            toView: toView,
            toModel: toModel
           };
  }

  export
  function checked( target: Target,
                    toView?: r.Extension<any,boolean>,
                    toModel?: r.Extension<boolean, any> ): Binding {
    return {mkview: Checked,
            model: target,
            dir: Direction.bi,
            toView: toView,
            toModel: toModel
           };
                    }

  export
  function clicked( target: Target,
                    toModel?: r.Extension<any, any> ) {
    return {mkview: Clicked.bind( null, true ),
            model: target,
            dir: Direction.v2m,
            toModel: toModel
           };
  }

  export
  function position( target: Target,
                     toView?: r.Extension<any,u.Point> ): Binding {
    return {mkview: Position,
            model: target,
            dir: Direction.m2v,
            toView: toView
           };
  }

  export
  function forEach( target: Target,
                    toView?: r.Extension<any,any> ): Binding {
    return {mkview: ForEach,
            model: target,
            dir: Direction.m2v,
            toView: toView,
            halt: true
           };
  }
}
