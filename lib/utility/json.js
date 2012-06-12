(function () {

  var toJS = function toJS(model) {
    if (hd.isVariable(model)) {
      model = model();
    }

    if (typeof model === "object") {
      Object.keys(model).forEach(function (key) {
        model[key] = toJS(model[key]);
      });
    } else if (Array.isArray(model)) {
      model = model.map(toJS);
    }

    return model;
  };

  var toJSON = function toJSON(value, replacer, space) {
    return JSON.stringify(toJS(value), replacer, space);
  };

  hd.toJS   = toJS;
  hd.toJSON = toJSON;

}());

