(function () {

  var ENTER_KEY = 13;

  var BetterTextbox = function BetterTextbox(tbox) {
    ASSERT(tbox instanceof jQuery, "expected jQuery object");

    this.tbox = tbox;
    publisher.initialize(this);

    /* Set up listeners that will delegate to our own events. */
    var self = this;
    tbox.on("focus", function btbFocus(evt) {
      self.publish("focus", evt);
    });

    tbox.on("blur", function btbBlur(evt) {
      self.publish("blur", evt);
    });

    tbox.on("keyup", function btbEdit(evt) {
      /* If the user hit enter, cancel this event and turn it into a blur
       * event. */
      if (evt.keyCode === ENTER_KEY) {
        setTimeout(function () {
          self.tbox.blur();
        }, 0);
        evt.stopPropagation();
        evt.preventDefault();
        return;
      }

      /* If an edit, the change has already been made to the text, and we
       * lost the rich information on the kind of change. For now, it is not
       * important to us. */
      self.publish("edit", evt);
    });

    this.onFocus(function selectOnFocus() {
      /* Must use a timeout because .select() will fire .focus() and cause
       * the handlers to be called twice. */
      setTimeout(function () {
        self.tbox.select();
      }, 0);
    });
  };

  publisher.mixin(BetterTextbox);

  var pt = BetterTextbox.prototype;

  pt.onFocus = function onFocus(cb, context) {
    this.subscribe("focus", cb, context);
  };

  pt.onEdit = function onEdit(cb, context) {
    this.subscribe("edit", cb, context);
  };

  pt.onBlur = function onBlur(cb, context) {
    this.subscribe("blur", cb, context);
  };

  pt.getCaret = function getCaret() {
    /* Credit to MarkB29:
     * http://stackoverflow.com/a/2897510/618906
     */
    var input = this.tbox.get(0);
    if ('selectionStart' in input) {
      // Standard-compliant browsers
      return input.selectionStart;
    } else if (document.selection) {
      // IE
      input.focus();
      var sel = document.selection.createRange();
      var selLen = document.selection.createRange().text.length;
      sel.moveStart('character', -input.value.length);
      return sel.text.length - selLen;
    }
  };

  pt.setCaret = function setCaret(index) {
    this.setSelectionRange(index, index);
  };

  pt.setSelectionRange = function setSelectionRange(begin, end) {
    /* Credit to CMS:
     * http://stackoverflow.com/a/499158/618906
     */
    var input = this.tbox.get(0);
    if (input.setSelectionRange) {
      input.focus();
      input.setSelectionRange(begin, end);
    } else if (input.createTextRange) {
      var range = input.createTextRange();
      range.collapse(true);
      range.moveEnd('character', end);
      range.moveStart('character', begin);
      range.select();
    }
  };

  pt.getText = function getText() {
    return this.tbox.val();
  };

  pt.setText = function setText(text) {
    if (this.getText() === text) return;
    /* TODO: What to do with caret? */
    this.tbox.val(text);
  };

  /* Provide abstractions for text insertion, removal, and replacement that
   * leave the caret position unchanged. */

  /* Insert a string before a position. */
  pt.insertText = function insertText(index, insertion) {
    /* Check for null operation. */
    if (!insertion) return;

    /* Since the underlying widget does not separate text mutation from caret
     * movement, we must remember the current caret location and restore it
     * after changing the text. */
    var pos = this.getCaret();

    /* TODO: Abstract into String.splice. */
    var text = this.getText();
    ASSERT(index >= 0 && index <= text.length,
      "out-of-bounds index");
    var before = text.slice(0, index), after = text.slice(index);
    this.tbox.val(before + insertion + after);

    /* If the caret was past the insertion point, we must adjust it by the
     * length of the insertion. */
    if (pos > index) pos += insertion.length;
    this.setCaret(pos);
  };

  /* Remove and return the substring in a half-open range. */
  pt.removeText = function removeText(begin, end) {
    /* Check for null operation. */
    if (begin === end) return;

    var pos = this.getCaret();

    /* TODO: Abstract into String.cut? */
    var text = this.getText();
    ASSERT(begin >= 0, "out-of-bounds begin");
    /* TODO: Should we support argument swapping? */
    ASSERT(begin < end, "begin should come before end");
    ASSERT(end <= text.length, "out-of-bounds end");
    var before = text.slice(0, begin),
      removal = text.slice(begin, end),
      after = text.slice(end);
    this.tbox.val(before + after);

    /* If the caret was past the range, we must adjust it by the length of
     * the range. If it was within the range, we move it to the beginning/end
     * of the range. */
    if (pos >= end) {
      pos -= removal.length;
    } else if (pos > begin) {
      pos = begin;
    }
    this.setCaret(pos);

    return removal;
  };

  pt.replaceText = function replaceText(begin, end, insertion) {
    var removal = this.removeText(begin, end);
    this.insertText(begin, insertion);
    return removal;
  };

  hd.BetterTextbox = BetterTextbox;

  var common = hd.__private.bindings;

  /* TODO: Share this abstraction with event binder. */
  var wrapCallback = function wrapCallback(cb, context) {
    return function cbWrapped(evt) {
      cb.call(context, context["$this"]);
      /* Prevent default and stop propagation. */
      return false;
    };
  };

  var onChange = function onChange(view, listener) {
    ASSERT(view instanceof BetterTextbox, "expected a better textbox");
    view.onEdit(listener);
  };

  var read = function read(view) {
    ASSERT(view instanceof BetterTextbox, "expected a better textbox");
    return { value: view.getText() };
  };

  var write = function write(view, value) {
    ASSERT(view instanceof BetterTextbox, "expected a better textbox");
    if (typeof value !== "string") value = JSON.stringify(value);
    view.setText(value);
  };

  var enable = function enable(view) {
    ASSERT(view instanceof BetterTextbox, "expected a better textbox");
    view.tbox.prop("diabled", false);
  };

  var disable = function disable(view) {
    ASSERT(view instanceof BetterTextbox, "expected a better textbox");
    view.tbox.prop("diabled", true);
  };

  var subbind = common.binder({
    onChange: onChange,
    read:     read,
    write:    write,
    enable:   enable,
    disable:  disable
  });

  hd.binders["btb"] = function bindBetterTextbox(view, options, context) {
    if (!(view instanceof BetterTextbox)) {
      view = new BetterTextbox(view);
    }

    /* Convenience option is to just past the variable for the value, in
     * which case there will be no binding for the editing state. */
    var value = options;

    if (typeof options === "object") {
      value = options.value;
      if (options.editing) hd.binders["focused"](view.tbox, options.editing);
      if (options.focus) {
        view.onFocus(wrapCallback(options.focus, context));
      }
      if (options.edit) {
        view.onEdit(wrapCallback(options.edit, context));
      }
      if (options.blur) {
        view.onBlur(wrapCallback(options.blur, context));
      }
    }

    subbind(view, value);
  };

}());

