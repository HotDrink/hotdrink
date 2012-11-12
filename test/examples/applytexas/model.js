var LEVELS = [
  "LOCAL",
  "CITY",
  "DISTRICT",
  "BI-DISTRICT",
  "REGIONAL",
  "STATE",
  "NATIONAL"
];

var ActivityYear = hd.model(function ActivityYear(year, num) {
  this.isActive  = hd.variable(false);
  this.year      = year;
  this.position  = hd.variable("");
  this.isElected = hd.variable("X");
  this.hours     = hd.variable(0);
  this.weeks     = hd.variable(0);
  this.id        = hd.computed(function () {
    return year + num();
  });
});

var Activity = hd.model(function Activity(list) {
  this.index = hd.computed(function () {
    return list().indexOf(this);
  });
  this.num  = hd.computed(function () {
    return this.index() + 1;
  });
  this.name  = hd.variable("");
  this.level = hd.variable();
  this.description = hd.variable("");
  this.years = ["Fresh", "Soph", "Junior", "Senior"].map(function(year) {
    return new ActivityYear(year, this.num);
  }, this);
});

var Model = hd.model(function Model() {
  this.activities = hd.list([]);
  this.activities.push(new Activity(this.activities));
  this.activities.push(new Activity(this.activities));
});

Model.prototype.promote = function promote(act) {
  this.activities.swap(act.index(), act.index() - 1);
};

Model.prototype.demote = function demote(act) {
  this.activities.swap(act.index(), act.index() + 1);
};

Model.prototype.addBefore = function addBefore(act) {
  this.activities.splice(act.index(), 0, new Activity(this.activities));
}

Model.prototype.addAfter = function addAfter(act) {
  this.activities.splice(act.index() + 1, 0, new Activity(this.activities));
}

