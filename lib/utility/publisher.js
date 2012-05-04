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
    if (!(evt in this.subscribers)) this.subscribers[evt] = [];

    var cbWrapped = function (args) {
      try {
        cb.apply(context, args);
      } catch (e) {
        WARN("bad subscriber");
      }
    };

    this.subscribers[evt].push(cbWrapped);
  };

  var publish = function publish(evt/*, ...*/) {
    if (!(evt in this.subscribers)) return;
    /* Get the arguments after evt. */
    var args = Array.prototype.slice.call(arguments, 1);
    this.subscribers[evt].forEach(function (cbWrapped) { cbWrapped(args); });
  };

  return {
    adapt : adapt,
    initialize : initialize,
    mixin : mixin
  };

}());

