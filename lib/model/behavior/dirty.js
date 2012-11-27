(function () {

  var factory    = hd.__private.factory;
  var PROTO_NAME = hd.PROTO_NAME;

  var isDirty = function isDirty() {
    return !this.isClean();
  };

  /***************************************************************/
  /* Each saved variable should know how to save and reset itself. */

  var isIdentical = function isIdentical(a, b) { return a === b; };

  var ScalarCleaner = function ScalarCleaner(now, cleaned, isEqual) {
    this.now     = now;
    this.cleaned = cleaned;
    this.isEqual = isEqual || isIdentical;
  };

  ScalarCleaner.prototype.isClean = function isClean() {
    return this.isEqual(this.now(), this.cleaned());
  };

  ScalarCleaner.prototype.isDirty = isDirty;

  ScalarCleaner.prototype.save = function save() {
    this.cleaned(this.now());
  };

  ScalarCleaner.prototype.reset = function reset() {
    this.now(this.cleaned());
  };

  /* Is there an intelligent way to do lists? */

  /***************************************************************/
  /* Private. */

  var reset = function reset() {
    this[PROTO_NAME].cleaners.forEach(function (cleaner) {
      cleaner.reset();
    });
  };

  var save = function save(truthy) {
    if (truthy) {
      this[PROTO_NAME].cleaners.forEach(function (cleaner) {
        cleaner.save();
      });
    }
  };

  /***************************************************************/
  /* Public. */

  var dirtyBehavior = hd.dirty = {};

  dirtyBehavior.mixin = function mixin(Ctor) {
    Ctor.prototype.reset = reset;
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
    var cleaner = new ScalarCleaner(now, cleaned, isEqual);
    proto.cleaners.push(cleaner);

    return this;
  };

}());

