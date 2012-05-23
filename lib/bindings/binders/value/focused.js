(function () {

  var writeFocused = function writeFocused(view, truthy) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    if (truthy) {
      if (!view.is(":focus")) view.focus();
    } else {
      if (view.is(":focus")) view.blur();
    }
  };

  var readFalse = function readFalse(view) {
    return { value: false };
  };

  var readTrue = function readTrue(view) {
    return { value: true };
  };

  var onFocus = function onFocus(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    view.on("focus", listener);
  };

  var onBlur = function onBlur(view, listener) {
    ASSERT(view instanceof jQuery, "expected jQuery object");
    view.on("blur", listener);
  };

  hd.binders["focused"] = function bindFocused(view, variable) {
    hd.bindRead(view, variable, { onChange: onFocus, read: readTrue });
    hd.bindRead(view, variable, { onChange: onBlur, read: readFalse });
    hd.bindWrite(variable, view, { write: writeFocused });
  };

  var writeBlurred = function writeBlurred(view, truthy) {
    return writeFocused(view, !truthy);
  };

  hd.binders["blurred"] = function bindBlurred(view, variable) {
    hd.bindRead(view, variable, { onChange: onFocus, read: readFalse });
    hd.bindRead(view, variable, { onChange: onBlur, read: readTrue });
    hd.bindWrite(variable, view, { write: writeBlurred });
  };

}());

