var Item = function Item(description) {
  this.description = hd.variable(description || "");
  this.isPending = hd.variable(true);
};

var Model = function Model() {

  this.next = hd.variable("");

  this.items = hd.list([
    hd.model(new Item("mow the lawn")),
    hd.model(new Item("buy milk")),
    hd.model(new Item("brush teeth"))
  ]);

  this.numPending = hd.computed(function () {
    return this.items().reduce(function (count, item) {
      return item.isPending() ? count + 1 : count;
    }, 0);
  });

  this.numComplete = hd.computed(function () {
    return this.items().length - this.numPending();
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
    this.items(this.items().filter(function (item) { return item.isPending(); }));
  };

};

var model = hd.model(new Model());

hotdrink.bind(model);

