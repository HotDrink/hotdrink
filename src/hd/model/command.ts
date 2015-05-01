module hd.model {

  import r = hd.reactive;

  export
  class Command extends Operation {

    onNext() {
      this.activate( false );
    }

    onError() { }

    onCompleted() { }

  }

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
        observables[i].addObserver( this, this.onNext, null, null, count++ );
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

    addObserver( observer: r.Observer<boolean> ): r.Observer<boolean>;
    addObserver( object: Object,
                 onNext: (value: boolean) => void,
                 onError: (error: any) => void,
                 onCompleted: () => void           ): r.Observer<boolean>;
    addObserver<U>( object: Object,
                    onNext: (value: boolean, id?: U) => void,
                    onError: (error: any, id?: U) => void,
                    onCompleted: (id?: U) => void,
                    id: U                                     ): r.Observer<boolean>;
    addObserver( object: Object,
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
  class SynchronousCommand extends Command {

    ready: r.Signal<boolean>;

    constructor( id: string,
                 name: string,
                 fn: Function,
                 inputs: any[],
                 outputs: any[] ) {
      super( id, name, fn, inputs, outputs );
      var count = 0;
      var properties: r.ProxyObservable<any>[] = [];
      for (var i = 0, l = inputs.length; i < l; ++i) {
        var vv = inputs[i];
        properties.push( vv.pending );
        properties.push( vv.error );
      }
      this.ready = new None( properties );
    }

    onNext() {
      if (this.ready.get()) {
        this.activate( false );
      }
    }

    onError() { }

    onCompleted() { }

  }

  function varValue( vv: Variable ) {
    return vv.value.get();
  }


}