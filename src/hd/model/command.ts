module hd.model {

  import r = hd.reactive;

  export
  class None extends r.BasicObservable<boolean> {

    observables: r.ProxyObservable<any>[];

    cache: boolean[] = [];

    result: boolean;

    constructor( observables: r.ProxyObservable<any>[] ) {
      super();
      this.observables = observables;
      this.cache.length = observables.length;

      var count = 0;
      for (var i = 0, l = observables.length; i < l; ++i) {
        if (typeof (<r.Signal<any>>observables[i]).addObserverInit === 'function') {
          (<r.Signal<any>>observables[i]).addObserverInit( this,
                                                           this.onNext,
                                                           null,
                                                           null,
                                                           count++
                                                         );
        }
        else {
          observables[i].addObserver( this, this.onNext, null, null, count++ );
        }
      }
    }

    onNext( value: any, count: number ) {
      this.cache[count] = value ? true : false;

      var none = true;
      for (var i = 0, l = this.cache.length; i < l; ++i) {
        if (this.cache[i] === undefined) { return }
        none = none && ! this.cache[i];
      }

      if (this.result !== none) {
        this.result = none;
        this.sendNext( none );
      }
    }

    addObserverInit( observer: r.Observer<boolean> ): r.Observer<boolean>;
    addObserverInit( object: Object,
                     onNext: (value: boolean) => void,
                     onError: (error: any) => void,
                     onCompleted: () => void           ): r.Observer<boolean>;
    addObserverInit<U>( object: Object,
                        onNext: (value: boolean, id?: U) => void,
                        onError: (error: any, id?: U) => void,
                        onCompleted: (id?: U) => void,
                        id: U                                     ): r.Observer<boolean>;
    addObserverInit( object: Object,
                     onNext?: (value: boolean, id?: any) => void,
                     onError?: (error: any, id?: any) => void,
                     onCompleted?: (id?: any) => void,
                     id?: any                                     ): r.Observer<boolean> {
      var added: r.Observer<boolean>;
      if (arguments.length === 1) {
        added = super.addObserver( <r.Observer<boolean>>object );
      }
      else {
        added = super.addObserver( object, onNext, onError, onCompleted, id );
      }
      if (added && this.result !== undefined) {
        added.onNext( this.result );
      }
      return added;
    }

    get(): boolean {
      return this.result;
    }
  }

  export
  class SynchronousCommand {

    ready: r.Signal<boolean>;

    constructor( public fn: Function, public args: Variable[] ) {
      var count = 0;
      var properties: r.Signal<any>[] = [];
      for (var i = 0, l = args.length; i < l; ++i) {
        var vv = args[i];
        properties.push( vv.pending );
        properties.push( vv.error );
      }
      this.ready = new None( properties );
    }

    onNext() {
      if (this.ready.get()) {
        this.fn.apply( null, this.args.map( varValue ) );
      }
    }

    onError() { }

    onCompleted() { }

  }

  function varValue( vv: Variable ) {
    return vv.value.get();
  }


}