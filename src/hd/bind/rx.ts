module hd.bindings {

  import r = hd.reactive;
  import m = hd.model;

  export
  function chain( ...e: r.Extension<any,any>[] ): r.Extension<any,any>;

  export
  function chain() {
    if (arguments.length == 0) {
      return;
    }
    else if (arguments.length == 1) {
      var e: any = arguments[0];
      if (Array.isArray( e )) {
        if (! e.every( isExtension )) {
          throw "Invalid extension passed to chain";
        }
        return new r.Chain<any,any>( e );
      }
      else {
        return e;
      }
    }
    else {
      var es : r.Extension<any,any>[] = [];
      for (var i = 0, l = arguments.length; i < l; ++i) {
        var e: any = arguments[i];
        if (Array.isArray( e )) {
          if (! e.every( isExtension )) {
            throw "Invalid extension passed to chain";
          }
          Array.prototype.push.apply( es, e );
        }
        else if (e) {
          if (! isExtension( e )) {
            throw "Invalid extension passed to chain";
          }
          es.push( e );
        }
      }
      if (es.length > 0) {
        return new r.Chain<any,any>( es );
      }
      else {
        return;
      }
    }
  }

  // export function path( model: m.Context, name: string ) {
  //   return new r.HotSwap<m.Position>( new m.Path( model, name ) );
  // }

  export function rw<T, U>( read: r.Observable<U>, write: r.Observer<T> ) {
    return new r.ReadWrite( read, write );
  }

  export function fn( thisArg: Object, f: Function, ...args: any[] ): r.FunctionExtension;
  export function fn( f: Function, ...args: any[] ): r.FunctionExtension;
  export function fn() {
    if (typeof arguments[0] === 'function') {
      return new r.FunctionExtension( arguments[0],
                                      null,
                                      Array.prototype.slice.call( arguments, 1 ) );
    }
    else {
      return new r.FunctionExtension( arguments[1],
                                      arguments[0],
                                      Array.prototype.slice.call( arguments, 2 ) );
    }
  }

  export function cn( value: any ) {
    return new r.Constant( value );
  }

  export
  function delay( time_ms: number ) {
    return new r.Delay( time_ms );
  }

  export
  function stabilize( time_ms: number, flush?: Object ) {
    return new r.Stabilizer( time_ms, flush );
  }

  export
  function msg( message: string ) {
    return new r.ReplaceError( message );
  }

  export
  function req() {
    return new r.Required();
  }

  export
  function def( value: any ) {
    return new r.Default( value );
  }

  export
  function round( places: number ) {
    return new r.Round( places );
  }

  export
  function fix( places: number ) {
    return new r.NumberToFixed( places );
  }

  export
  function prec( sigfigs: number ) {
    return new r.NumberToPrecision( sigfigs );
  }

  export
  function exp( places: number ) {
    return new r.NumberToExponential( places );
  }

  export
  function scale( factor: number ) {
    return new r.ScaleNumber( factor );
  }

  export
  function toStr() {
    return new r.ToString();
  }

  export
  function toJson() {
    return new r.ToJson();
  }

  export
  function toDate() {
    return new r.ToDate();
  }

  export
  function dateToString() {
    return new r.DateToString();
  }

  export
  function dateToDateString() {
    return new r.DateToDateString();
  }

  export
  function dateToTimeString() {
    return new r.DateToTimeString();
  }

  export
  function dateToMilliseconds() {
    return new r.DateToMilliseconds();
  }

  export
  function millisecondsToDate() {
    return new r.MillisecondsToDate();
  }

  export
  function toNum() {
    return new r.ToNumber();
  }

  export
  function offset( dx: number, dy: number ) {
    return new r.Offset( dx, dy );
  }

  export
  function pointToString() {
    return new r.PointToString();
  }
}
