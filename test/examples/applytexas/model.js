var LEVELS = [
  "LOCAL",
  "CITY",
  "DISTRICT",
  "BI-DISTRICT",
  "REGIONAL",
  "STATE",
  "NATIONAL"
];

var ActivityYear = hd.model(function ActivityYear(year, index) {
  this.isActive  = hd.variable(false);
  this.year      = year;
  this.position  = hd.variable("");
  this.isElected = hd.variable("X");
  this.hours     = hd.variable(0);
  this.weeks     = hd.variable(0);
  this.id        = hd.computed(function () {
    return year + index();
  });
});

var Activity = hd.model(function Activity(list) {
  this.index = hd.computed(function () {
    return list().indexOf(this) + 1;
  });
  this.name  = hd.variable("");
  this.level = hd.variable();
  this.description = hd.variable("");
  this.years = ["Fresh", "Soph", "Junior", "Senior"].map(function(year) {
    return new ActivityYear(year, this.index);
  }, this);
});

var Model = hd.model(function Model() {
  this.activities = hd.list([]);
  this.activities.push(new Activity(this.activities));
  this.activities.push(new Activity(this.activities));
});

Model.prototype.promote = function promote(activity) {
  var i = this.activities().indexOf(activity);
  this.activities.swap(i, i - 1);
};

Model.prototype.demote = function demote(activity) {
  var i = this.activities().indexOf(activity);
  this.activities.swap(i, i + 1);
};

