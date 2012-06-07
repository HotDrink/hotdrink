var Item = hd.model(function Item(description) {
  this.description = hd.variable(description || "");
  this.isComplete = hd.variable(false);
  this.isEditing = hd.variable(false);
});

var Model = hd.model(function Model() {

  this.next = hd.variable("");

  this.items = hd.list([]);

  this.hasItems = hd.computed(function () {
    return this.items().length;
  });

  this.numComplete = hd.computed(function () {
    return this.items().reduce(function (count, item) {
      return item.isComplete() ? count + 1 : count;
    }, 0);
  });
  
  this.numPending = hd.computed(function () {
    return this.items().length - this.numComplete();
  });

  this.numPendingUnits = hd.computed(function () {
    return (this.numPending() === 1) ? "item" : "items";
  });

  this.isAllComplete = hd.computed(function () {
    return !this.numPending();
  }, function (value) {
    this.items().forEach(function (item) {
      item.isComplete(value);
    });
  });

  this.remove = function remove(item) {
    this.items.remove(item);
  };

  this.startEditing = function startEditing(item) {
    item.isEditing(true);
  };

  this.finishEditing = function finishEditing(item) {
    var desc = item.description().trim();
    if (desc) {
      item.description(desc);
    } else {
      this.remove(item);
    }
  };

  this.add = function add() {
    var next = this.next().trim();
    if (next) this.items.push(new Item(next));
    this.next("");
  };

  this.prune = function prune() {
    this.items.filter(function (item) { return !item.isComplete(); });
  };

});

hd.bind(new Model);

