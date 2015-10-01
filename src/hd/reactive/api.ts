module hd {

  import r = hd.reactive;

  export var ProxyObserver = r.ProxyObserver;
  export var BasicObservable = r.BasicObservable;
  export var Promise = r.Promise;
  export var Extension = r.Extension;
  export var liftFunction = r.liftFunction;


  /*==================================================================
   * Enablement functions
   */

  export function markUsed( p: r.Promise<any> ) {
    p.usage.set( r.Usage.Used );
  }

  export function markUnused( p: r.Promise<any> ) {
    p.usage.set( r.Usage.Unused );
  }

  export function markDelayed( p: r.Promise<any> ) {
    p.usage.set( r.Usage.Delayed );
  }

}
