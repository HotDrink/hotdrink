(function () {

  var addOutgoing = function addOutgoing() {
    Array.prototype.push.apply(this._outgoingValidators, arguments);
    return this;
  };

  var addIncoming = function addIncoming() {
    Array.prototype.push.apply(this._incomingValidators, arguments);
    return this;
  };

  hd.validator = function validator() {
    var outgoingValidators = [];
    var incomingValidators = [];

    var makeValidator = function makeValidator() {
      var i;
      for (i = 0; i < outgoingValidators.length; ++i) {
        this.outgoing(outgoingValidators[i].apply(window, arguments));
      }
      for (i = 0; i < incomingValidators.length; ++i) {
        this.incoming(incomingValidators[i].apply(window, arguments));
      }
      return this;
    };

    makeValidator.outgoing = addOutgoing;
    makeValidator._outgoingValidators = outgoingValidators;
    makeValidator.incoming = addIncoming;
    makeValidator._incomingValidators = incomingValidators;

    return makeValidator;
  };

  hd.validators = {};

  hd.validators.outgoing = function outgoing() {
    Array.prototype.push.apply(this._outgoing, arguments);
    return this;
  };

  hd.validators.prependOutgoing = function prependOutgoing() {
    Array.prototype.unshift.apply(this._outgoing, arguments);
    return this;
  };

  hd.validators.incoming = function incoming() {
    Array.prototype.push.apply(this._incoming, arguments);
    return this;
  };

  hd.validators.prependIncoming = function prependIncoming() {
    Array.prototype.unshift.apply(this._incoming, arguments);
    return this;
  };

  hd.validators.required = hd.validator().outgoing(hd.util.required);

  hd.validators.defaultValue = hd.validator().outgoing(hd.util.defaultValue);

  hd.validators.trim = hd.validator().outgoing(hd.util.trim);

  hd.validators.match = hd.validator().outgoing(hd.util.match);

  hd.validators.number = hd.validator().outgoing(hd.util.toNum)
                                       .incoming(hd.util.toString);

  hd.validators.min = hd.validator().outgoing(hd.util.min);

  hd.validators.max = hd.validator().outgoing(hd.util.max);

  hd.validators.range = hd.validator().outgoing(hd.util.range);

  hd.validators.date = hd.validator().outgoing(hd.util.toDate)
                                     .incoming(hd.util.dateToString);

}());