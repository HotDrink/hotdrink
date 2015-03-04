module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  export
  class Path extends r.BasicObservable<any> {
    start: Modelcule;
    path: string[];
    properties: r.ObservableProperty<any>[] = null;
    result: any;

    constructor( start: Modelcule, path: string[] ) {
      super();
      this.start = start;
      this.path = path;
      this.followPath();
    }

    get() {
      return this.result
    }

    addObserverInit( observer: r.Observer<any> ): r.Observer<any>;
    addObserverInit( object: Object,
                     onNext: (value: any) => void,
                     onError: (error: any) => void,
                     onCompleted: () => void        ): r.Observer<any>;
    addObserverInit<U>( object: Object,
                        onNext: (value: any, id?: U) => void,
                        onError: (error: any, id?: U) => void,
                        onCompleted: (id?: U) => void,
                        id: U                                  ): r.Observer<any>;
    addObserverInit( object: Object,
                     onNext?: (value: any, id?: any) => void,
                     onError?: (error: any, id?: any) => void,
                     onCompleted?: (id?: any) => void,
                     id?: any                                  ): r.Observer<any> {

      if (this.properties) {
        var added: r.Observer<any>;
        if (arguments.length === 1) {
          added = super.addObserver( <r.Observer<any>>object );
        }
        else {
          added = super.addObserver( object, onNext, onError, onCompleted, id );
        }
        if (added) {
          added.onNext( this.result );
        }
        return added;
      }
      else {
        if (arguments.length == 1) {
          (<r.Observer<any>>object).onNext( this.result );
        }
        else {
          onNext.call( object, this.result, id );
        }
      }
    }

    private
    followPath() {
      var properties: r.ObservableProperty<any>[] = [];
      var m = this.start;
      for (var i = 0, l = this.path.length; m != null && i < l; ++i) {
        var name = this.path[i];
        var propname = '$' + name;
        if (propname in m) {
          var p = m[propname];
          p.addObserver( this, this.onChange, null, null );
          properties.push( p );
          m = p.get();
        }
        else {
          m = m[name];
        }
      }
      if (m !== this.result) {
        this.result = m;
        this.sendNext( m );
      }
      if (properties.length > 0) {
        this.properties = properties;
      }
      else {
        this.sendCompleted(); // should be unnecessary
      }
    }

    private
    onChange() {
      if (this.properties) {
        this.properties.forEach( function( p: r.ObservableProperty<any> ) {
          p.removeObserver( this );
        }, this );
        this.properties = null;
      }
      this.followPath();
    }
  }
}