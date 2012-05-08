var Item = function Item(description) {
  this.description = hd.variable(description || "");
  this.isComplete = hd.variable(false);
};

var Model = function Model() {

  this.next = hd.variable("");

  this.items = hd.list([
    hd.model(new Item("mow the lawn")),
    hd.model(new Item("buy milk")),
    hd.model(new Item("brush teeth"))
  ]);

  this.isAllComplete = hd.computed(function () {
    return this.items().length &&
    this.items().every(function (item) {
      return item.isComplete();
    });
  }, function (value) {
    this.items().forEach(function (item) {
      item.isComplete(value);
    });
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

  this.remove = function remove(item) {
    this.items.remove(item);
  };

  this.add = function add() {
    var next = this.next().trim();
    if (next) this.items.push(hd.model(new Item(next)));
    this.next("");
  };

  this.prune = function prune() {
    this.items(this.items().filter(function (item) { return !item.isComplete(); }));
  };

};

var model = hd.model(new Model());

hotdrink.bind(model);

