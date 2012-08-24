(function () {

  var factory    = hd.__private.factory;
  var PROTO_NAME = hd.PROTO_NAME;

  /* Each saved variable should know how to save and reset itself. */

  /***************************************************************/
  var isIdentical = function isIdentical(a, b) { return a === b; };

  var SaverScalar = function SaverScalar(here, there, isEqual) {
    this.here    = here;
    this.there   = there;
    this.isEqual = isEqual || isIdentical;
  };

  SaverScalar.prototype.isSaved = function isSaved() {
    return this.isEqual(this.here(), this.there());
  };

  SaverScalar.prototype.save = function save() {
    this.there(this.here());
  };

  SaverScalar.prototype.reset = function reset() {
    this.here(this.there());
  };

  /***************************************************************/
  var SaverList = function SaverList(list) {
    this.list = list;
  };

  SaverList.prototype.save = function save() {
    this.list().forEach(function (item) {
      item.isSaved(true);
    });
  };

  SaverList.prototype.reset = function reset() {
    this.list().forEach(function (item) {
      item.reset();
    });
  };

  /***************************************************************/
  var save = function save(truthy) {
    if (truthy) {
      this[PROTO_NAME].savers.forEach(function (saver) { saver.save(); });
    }
  };

  var reset = function reset() {
    this[PROTO_NAME].savers.forEach(function (saver) { saver.reset(); });
  };

  hd.saves = function saves(model) {
    var reserved = model[PROTO_NAME] = (model[PROTO_NAME] || {});
    var savers   = reserved.savers      = [];

    model.isSaved = factory.computed(function () {
      return savers.every(function (saver) { return saver.isSaved(); });
    }, save);

    var proto = model.constructor.prototype;
    if (!proto.reset) {
      proto.reset = reset;
    }
  };

  hd.reset = function wrappedReset(model) {
    reset.call(model);
  };

  hd.proxy.save = function saveVariable(isEqual) {
    var model = factory.contexts[0];
    ASSERT(model, "expected context for saved variable");
    var proto = model[PROTO_NAME];
    ASSERT(proto && proto.savers,
      "expected preparation by calling hd.saves");

    var here  = this;
    var there = factory.variable(here());
    var saver = new SaverScalar(here, there, isEqual);
    proto.savers.push(saver);

    return this;
  };

}());

