var publisher = (function () {

  var initialize = function initialize(o) {
    o.subscribers = Object.create(null);
    o.drafts      = Object.create(null);
  };

  var mixin = function mixin(Klass) {
    Klass.prototype.subscribe = subscribe;
    Klass.prototype.draft     = draft;
    Klass.prototype.hasDraft  = hasDraft;
    Klass.prototype.publish   = publish;
  };

  /* For callbacks: subscribers pick the context, publishers pick the
   * arguments. */
  var subscribe = function subscribe(evt, cb, context) {
    var subscribers = this.subscribers;
    if (!(subscribers.hasOwnProperty(evt))) {
      subscribers[evt] = [];
    }

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

  /* Save the arguments for later. */
  var draft = function draft(evt/*, ...*/) {
    var args = Array.prototype.slice.call(arguments, 1);
    this.drafts[evt] = args;
  };

  var hasDraft = function hasDraft(evt) {
    return !!this.drafts[evt];
  };

  /* If no arguments are given, use the draft if it exists (then delete it).
   * If arguments are given, leave the draft intact and publish immediately. */
  var publish = function publish(evt/*, ...*/) {
    if (!(evt in this.subscribers)) return;

    if (arguments.length > 1 || !this.hasDraft(evt)) {
      var args = Array.prototype.slice.call(arguments, 1);
    } else {
      var args = this.drafts[evt];
      delete this.drafts[evt];
    }

    this.subscribers[evt].forEach(function (cbWrapped) {
      cbWrapped(args);
    });
  };

  return {
    initialize : initialize,
    mixin      : mixin
  };

}());

