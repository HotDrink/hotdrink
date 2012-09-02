(function () {

  var factory    = hd.__private.factory;
  var PROTO_NAME = hd.PROTO_NAME;

  var isDirty = function isDirty() {
    return !this.isClean();
  };

  /***************************************************************/
  /* Each saved variable should know how to save and reset itself. */

  var isIdentical = function isIdentical(a, b) { return a === b; };

  var CleanScalar = function CleanScalar(now, cleaned, isEqual) {
    this.now     = now;
    this.cleaned = cleaned;
    this.isEqual = isEqual || isIdentical;
  };

  CleanScalar.prototype.isClean = function isClean() {
    return this.isEqual(this.now(), this.cleaned());
  };

  CleanScalar.prototype.isDirty = isDirty;

  CleanScalar.prototype.save = function save() {
    this.cleaned(this.now());
  };

  CleanScalar.prototype.reset = function reset() {
    this.now(this.cleaned());
  };

  /* Is there an intelligent way to do lists? */

  /***************************************************************/

  var dirtyBehavior = hd.dirty = {};

  var reset = function reset() {
    this[PROTO_NAME].cleaners.forEach(function (cleaner) {
      cleaner.reset();
    });
  };

  dirtyBehavior.mixin = function mixin(Ctor) {
    Ctor.prototype.reset = reset;
  };

  var save = function save(truthy) {
    if (truthy) {
      this[PROTO_NAME].cleaners.forEach(function (cleaner) {
        cleaner.save();
      });
    }
  };

  dirtyBehavior.enterCtor = function enterCtor(model) {
    var cleaners = model[PROTO_NAME].cleaners = [];

    model.isClean = factory.computed(function () {
      return cleaners.every(function (cleaner) {
        return cleaner.isClean();
      });
    }, save);

    model.isDirty = isDirty;
  };

  hd.proxy.save = function save(isEqual) {
    var model = factory.contexts[0];
    ASSERT(model, "expected context for clean variable");
    var proto = model[PROTO_NAME];
    ASSERT(proto && proto.cleaners,
      "expected dirty behavior to be enabled");

    var now     = this;
    var cleaned = factory.variable(now());
    var cleaner = new CleanScalar(now, cleaned, isEqual);
    proto.cleaners.push(cleaner);

    return this;
  };

}());

