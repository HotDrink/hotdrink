module hd.model {

  import u = hd.utility;
  import r = hd.reactive;

  export
  class Command extends r.BasicObservable<Command> {

    // Unique identifier; assigned by Factory
    id: string;

    // Human readable name for programmer
    name: string;

    // Function that implements this operation
    fn: Function;

    // Alternative to fn -- a hard-coded function result
    result: any;

    // Inputs to pass to the function, in the order they should be passed
    // Variables in this list will be replaced with their value; everything
    // else will be treated as constants to be passed to the function.
    inputs: u.MultiArray<any>;

    // Parallel to inputs; true means input comes from prior generation
    priorFlags: u.MultiArray<boolean>;

    // Outputs to write to, in the order they are returned form the function
    outputs: u.MultiArray<Variable>;

    // Is this an external operation?  (Does it trigger an update after execution?)
    external = true;

    constructor( name: string,
                 fn: any,
                 inputs: u.MultiArray<any>,
                 priorFlags: u.MultiArray<boolean>,
                 outputs: u.MultiArray<Variable> ) {
      super();
      this.id = makeId( name );
      this.name = name;
      if (typeof fn === 'function') {
        this.fn = fn;
      }
      else {
        this.result = fn;
      }
      this.inputs = inputs;
      this.priorFlags = priorFlags;
      this.outputs = outputs;
    }

    activate: () => void;
    onNext() {
      this.sendNext( this );
    }

    onError() { }

    onCompleted() { }


  }

  Command.prototype.activate = Command.prototype.onNext;


  export
  class None extends r.BasicSignal<boolean> {

    observables: r.ProxyObservable<any>[];

    cache: boolean[] = [];

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

      this.set( none );
    }
  }

  export
  class SynchronousCommand extends Command {

    ready: r.Signal<boolean>;

    constructor(
      name: string,
      fn: Function,
      inputs: u.MultiArray<any>,
      usePriors: u.MultiArray<boolean>,
      outputs: u.MultiArray<Variable>
    ) {

      super( name, fn, inputs, usePriors, outputs );
      var properties: r.ProxyObservable<any>[] = [];
      for (var i = 0, l = inputs.length; i < l; ++i) {
        var vv = inputs[i];
        if (vv instanceof Variable) {
          properties.push( vv.pending );
          properties.push( vv.error );
        }
      }
      this.ready = new None( properties );
    }

    onNext() {
      if (this.ready.get()) {
        this.sendNext( this );
      }
    }

  }

  SynchronousCommand.prototype.activate = SynchronousCommand.prototype.onNext;

  function varValue( vv: Variable ) {
    return vv.value.get();
  }


}
