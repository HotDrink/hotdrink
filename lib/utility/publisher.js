var publisher = (function () {

  var adapt = function adapt(o) {
    ["subscribers", "subscribe", "publish"].forEach(function (f) {
      if (o[f] !== undefined) {
        ERROR("new publisher already has property: " + f);
      }
    });

    o.subscribers = {};
    o.subscribe = subscribe;
    o.publish = publish;
  };

  var initialize = function initialize(o) {
    o.subscribers = {};
  };

  var mixin = function mixin(Klass) {
    Klass.prototype.subscribe = subscribe;
    Klass.prototype.publish = publish;
  };

  /* For callbacks: subscribers pick the context, publishers pick the
   * arguments. */
  var subscribe = function subscribe(evt, cb, context) {
    var subscribers = this.subscribers;
    if (!(evt in subscribers)) subscribers[evt] = [];

    var cbWrapped = function cbWrapped(args) {
      try {
        cb.apply(context, args);
      } catch (e) {
        /* Unsubscribe itself. */
        var subscriptions = subscribers[evt];
        var index = subscriptions.indexOf(cbWrapped);
        subscriptions.splice(index, 1);
      }
    };

    subscribers[evt].push(cbWrapped);
  };

  var publish = function publish(evt/*, ...*/) {
    if (!(evt in this.subscribers)) return;
    /* Get the arguments after evt. */
    var args = Array.prototype.slice.call(arguments, 1);
    this.subscribers[evt].forEach(function (cbWrapped) {
      cbWrapped(args);
    });
  };

  return {
    adapt : adapt,
    initialize : initialize,
    mixin : mixin
  };

}());

