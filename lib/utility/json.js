(function () {

  var toJS = function toJS(model) {
    if (hd.isVariable(model)) {
      model = model();
    }

    var copy = model;
    if (Array.isArray(model)) {
      /* Arrays are Objects too, so must check this case first. */
      copy = model.map(toJS);
    } else if (typeof model === "object") {
      copy = {};
      Object.keys(model).forEach(function (key) {
        copy[key] = toJS(model[key]);
      });
    }

    return copy;
  };

  var toJSON = function toJSON(value, replacer, space) {
    return JSON.stringify(toJS(value), replacer, space);
  };

  hd.toJS   = toJS;
  hd.toJSON = toJSON;

}());

