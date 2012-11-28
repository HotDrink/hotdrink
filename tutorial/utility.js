(function () {

  var MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  dateToString = function dateToString(date) {
    if (!date) return undefined;
    return date.getDate() + " " +
      MONTH_NAMES[date.getMonth()] + " " +
      (date.getYear() + 1900);
  };

  MS_IN_DAY = 1000 * 60 * 60 * 24;

}());

