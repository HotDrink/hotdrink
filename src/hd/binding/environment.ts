module hd.binding {

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
  class BindEnvironment {

    public el:    HTMLElement;
    public scope: Scope;

    constructor( el: HTMLElement, scope: Scope ) {
      el = el;
      scope = scope;
    }

    /*--------------------------------------------------------------*/

    edit(
      target:   Target,
      toView?:  r.Extension<any, string>
    ):          Binding;
    edit<T>(
      target:   Target,
      toView:   r.Extension<T, string>,
      toModel:  r.Extension<string, T>
    ):          Binding;
    edit(
      target:   Target,
      toView?:  r.Extension<any, string>,
      toModel?: r.Extension<string, any>
    ):          Binding {

      return {
        view:    new Edit( this.el ),
        model:   target,
        dir:     Direction.bi,
        toView:  toView,
        toModel: concat( toModel, new r.Stabilizer() )
      };
    }

    /*--------------------------------------------------------------*/

    editVar(
      vv:       m.Variable,
      toView?:  r.Extension<any, string>
    ):          u.MultiArray<Binding>;
    editVar<T>(
      vv:       m.Variable,
      toView:   r.Extension<T, string>,
      toModel:  r.Extension<string, T>
    ):          u.MultiArray<Binding>;
    editVar(
      vv:       m.Variable,
      toView?:  r.Extension<any, string>,
      toModel?: r.Extension<string, any>
    ):          u.MultiArray<Binding> {

      return [
        this.edit( vv, toView, toModel ),
        this.cssClass( vv ),
        this.enabled( vv.relevant )
      ];
    }

    /*--------------------------------------------------------------*/

    num(
      target:   Target,
      places?:  number
    ):          Binding;
    num<T>(
      target:   Target,
      places:   number,
      toView:   r.Extension<T, number>,
      toModel:  r.Extension<number, T>
    ):          Binding;
    num(
      target:   Target,
      places?:  number,
      toView?:  r.Extension<any,number>,
      toModel?: r.Extension<number,any>
    ):          Binding {

      if (places === undefined || places === null) {
        return {
          view:    new Edit( this.el ),
          model:   target,
          dir:     Direction.bi,
          toView:  toView,
          toModel: concat(
            concat( new r.ToNumber(), toModel ),
            new r.Stabilizer()
          )
        };
      }
      else {
        return {
          view:    new Edit( this.el ),
          model:   target,
          dir:     Direction.bi,
          toView:  concat(
            toView,
            places >= 0 ? new r.NumberToFixed( places ) : new r.Round( places )
          ),
          toModel: concat(
            concat( [new r.ToNumber(), new r.Round( places )], toModel ),
            new r.Stabilizer()
          )
        };
      }
    }

    /*--------------------------------------------------------------*/

    numVar(
      vv:       m.Variable,
      places?:  number
    ):          u.MultiArray<Binding>;
    numVar<T>(
      vv:       m.Variable,
      places:   number,
      toView:   r.Extension<T, number>,
      toModel:  r.Extension<number,T >
    ):          u.MultiArray<Binding>;
    numVar<T>(
      vv:       m.Variable,
      places?:  number,
      toView?:  r.Extension<T, number>,
      toModel?: r.Extension<number, T>
    ):          u.MultiArray<Binding> {

      return [
        this.num( vv, places, toView, toModel ),
        this.cssClass( vv ),
        this.enabled( vv.relevant )
      ];
    }

    /*--------------------------------------------------------------*/

    date(
      target:   Target
    ):          Binding;
    date<T>(
      target:   Target,
      toView:   r.Extension<T,Date>,
      toModel:  r.Extension<Date,T>
    ):          Binding;
    date(
      target:   Target,
      toView?:  r.Extension<any,Date>,
      toModel?: r.Extension<Date,any>
    ):          Binding {

      return {
        view:    new Edit( this.el ),
        model:   target,
        dir:     Direction.bi,
        toView:  concat( toView, new r.DateToDateString() ),
        toModel: concat(
          concat( new r.ToDate(), toModel ), new r.Stabilizer()
        )
      };
    }

    /*--------------------------------------------------------------*/

    dateVar(
      vv:       m.Variable
    ):          u.MultiArray<Binding>;
    dateVar<T>(
      vv:       m.Variable,
      toView:   r.Extension<T, Date>,
      toModel:  r.Extension<Date, T>
    ):          u.MultiArray<Binding>;
    dateVar(
      vv:       m.Variable,
      toView?:  r.Extension<any, Date>,
      toModel?: r.Extension<Date, any>
    ):          u.MultiArray<Binding> {

      return [
        this.date( vv, toView, toModel ),
        this.cssClass( vv ),
        this.enabled( vv.relevant )
      ];
    }

    /*--------------------------------------------------------------*/

    text(
      target: Target,
      toView?: r.Extension<any,string>
    ): Binding {

      return {
        view:   new Text( this.el ),
        model:  target,
        toView: toView,
        dir:    Direction.m2v
      };
    }

    /*--------------------------------------------------------------*/

    cssClass(
      target:   Target,
      ontrue?:  string,
      onfalse?: string,
      toView?:  r.Extension<any, boolean>
    ):          Binding|Binding[] {

      if (ontrue || onfalse || !(target instanceof m.Variable)) {
        return {
          view:   new CssClass( this.el, ontrue, onfalse ),
          model:  target,
          dir:    Direction.m2v,
          toView: toView
        };
      }
      else {
        var vv = <m.Variable>target;
        return [
          {view:  new CssClass( this.el, 'source', 'derived' ),
           model: vv.source,
           dir:   Direction.m2v},

          {view:  new CssClass( this.el, 'stale', 'current' ),
           model: vv.stale,
           dir:   Direction.m2v},

          {view:  new CssClass( this.el, 'pending', 'complete' ),
           model: vv.pending,
           dir:   Direction.m2v},

          {view:   new CssClass( this.el, 'contributing', 'noncontributing' ),
           model:  vv.contributing,
           dir:    Direction.m2v},

          {view:   new CssClass( this.el, 'error', null ),
           model:  vv.error,
           dir:    Direction.m2v}
        ];
      }
    }

    /*--------------------------------------------------------------*/

    enabled(
      target:  Target,
      toView?: r.Extension<any, boolean>
    ):         Binding {

      return {
        view:   new Enabled( this.el ),
        model:  target,
        dir:    Direction.m2v,
        toView: toView
      };
    }

    /*--------------------------------------------------------------*/

    value(
      target:   Target,
      toView?:  r.Extension<any, string>,
      toModel?: r.Extension<string, any>
    ):          Binding {

      return {
        view:    new Value( this.el ),
        model:   target,
        dir:     Direction.bi,
        toView:  toView,
        toModel: toModel
      };
    }

    /*--------------------------------------------------------------*/

    checked(
      target:   Target
    ):          Binding;
    checked<T>(
      target:   Target,
      toView:   r.Extension<T, boolean>,
      toModel:  r.Extension<boolean, T>
    ):          Binding;
    checked(
      target:   Target,
      toView?:  r.Extension<any, boolean>,
      toModel?: r.Extension<boolean, any>
    ):          Binding {

      return {
        view:    new Checked( this.el ),
        model:   target,
        dir:     Direction.bi,
        toView:  toView,
        toModel: toModel
      };
    }

    /*--------------------------------------------------------------*/

    mousedown(
      target:   Target,
      toModel?: r.Extension<MouseEvent, any>
    ):          Binding {

      return {
        view:    new MouseDown( this.el ),
        model:   target,
        dir:     Direction.v2m,
        toModel: toModel
      };
    }

    /*--------------------------------------------------------------*/

    mouseup(
      target:   Target,
      toModel?: r.Extension<MouseEvent, any>
    ):          Binding {

      return {
        view:    new MouseUp( this.el ),
        model:   target,
        dir:     Direction.v2m,
        toModel: toModel
      };
    }

    /*--------------------------------------------------------------*/

    click(
      target: Target,
      toModel?: r.Extension<MouseEvent, any>
    ) {

      return {
        view:    new Click( this.el ),
        model:   target,
        dir:     Direction.v2m,
        toModel: toModel
      };
    }

    /*--------------------------------------------------------------*/

    dblclick(
      target:   Target,
      toModel?: r.Extension<MouseEvent, any>
    ):          Binding {

      return {
        view:    new DblClick( this.el ),
        model:   target,
        dir:     Direction.v2m,
        toModel: toModel
      };
    }

    /*--------------------------------------------------------------*/

    position(
      target:  Target,
      toView?: r.Extension<any, u.Point>
    ):         Binding {

      return {
        view:   new Position( this.el ),
        model:  target,
        dir:    Direction.m2v,
        toView: toView
      };
    }

    /*--------------------------------------------------------------*/

    forEach(
      name:   string,
      target: Target,
      idx:    string
    ):        Binding {

      return {
        view:  new ForEach( this.el, this.scope, name, idx ),
        model: target,
        dir:   Direction.m2v,
        halt:  true
      };
    }

    /*--------------------------------------------------------------*/

    when(
      target:  Target,
      toView?: r.Extension<any, boolean>
    ):         Binding {

      return {
        view:   new When( this.el ),
        model:  target,
        dir:    Direction.m2v,
        toView: toView
      };
    }
  }
}
