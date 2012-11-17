(function () {

  var factory    = hd.__private.factory;
  var PROTO_NAME = hd.PROTO_NAME;

  /***************************************************************/
  /* Final processing */

  var submit = function submit() {
    /* In here, we can pretend that we are a client with access to hd. */
    hd.toJS(this);
  };

  var sink = function sink() {
    Object.keys(this).forEach(function (v) {
      if (hd.isVariable(this[v])) {
        this[v]();
      }
    }, this);
  };

  var maybeAddCommand = function maybeAddCommand(model) {

    /* We will add a default command if the user did not. */
    var hasCommand = false;

    /* Now we can assign the name the user wanted. */
    Object.keys(model).forEach(function (v) {
      var value = model[v];

      if (hd.isProxy(value)) {
        var vv = value.unwrap();

        if (vv.cellType === "command") {
          hasCommand = true;
        }

        vv.id = v;
        if (vv.inner) {
          var ccStay = vv.inner.stayConstraint.outer;
          ccStay.id = vv.id + "_stay";
          var mmStay = ccStay.methods[0];
          mmStay.id = vv.id + "_const";
        }
      }
    });

    /* The default command is a no-op that accesses every variable so that
     * they are all relevant. It is invisible to users. */
    if (!hasCommand) {
      hd.command(sink);
    }

  };

  /***************************************************************/
  /* Model constructor "prototype" */

  var call = function call(context/*, args...*/) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this[PROTO_NAME].Ctor.apply(context, args);
  };

  var apply = function apply(context, args) {
    return this[PROTO_NAME].Ctor.apply(context, args);
  };

  var behaviors = function behaviors(/*behaviors...*/) {
    Array.prototype.forEach.call(arguments, function (behavior) {
      var bs = this[PROTO_NAME].behaviors;
      if (bs.has(behavior)) return;
      behavior.mixin(this);
      bs.push(behavior);
    }, this);
  };

  /***************************************************************/
  /* hd.model */

  var finishModelConstructor = function finishModelConstructor(Base, Ctor) {
    if (typeof Ctor === "undefined") {
      Ctor = Base;
      Base = undefined;
    } else {
      Ctor.prototype = Object.create(Base.prototype);
    }

    var CtorHd = function CtorHd(/*...*/) {
      var model = this;
      var bs    = CtorHd[PROTO_NAME].behaviors;

      factory.contexts.unshift(model);
      model[PROTO_NAME] = {};
      bs.forEach(function (behavior) {
        if (behavior.enterCtor) {
          behavior.enterCtor(model);
        }
      });

      Ctor.apply(model, arguments);

      maybeAddCommand(model);
      bs.forEach(function (behavior) {
        if (behavior.exitCtor) {
          behavior.exitCtor(model);
        }
      });
      factory.contexts.shift();
      hd.update();
    };

    CtorHd.prototype = Ctor.prototype;
    CtorHd.call      = call;
    CtorHd.apply     = apply;
    CtorHd.behaviors = behaviors;

    CtorHd[PROTO_NAME] = {
      Ctor:      Ctor,
      behaviors: (Base && Base[PROTO_NAME])
        ? Base[PROTO_NAME].behaviors.slice()
        : []
    };

    return CtorHd;
  };

  factory.model = function model(one, two) {
    if (typeof one === "function") {
      return finishModelConstructor(one, two);
    }

    /* The general case for a Model is a constructor. We support plain
     * objects as a convenience. */
    ASSERT(typeof one === "object",
      "expected object or constructor for model");
    maybeAddCommand(one);
    hd.update();
    return one;
  };

  hd.model = factory.model;

}());

