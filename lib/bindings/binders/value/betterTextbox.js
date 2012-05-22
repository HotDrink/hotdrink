(function () {

  var ENTER_KEY = 13;

  var BetterTextbox = function BetterTextbox(tbox) {
    ASSERT(tbox instanceof jQuery, "expected jQuery object");

    this.tbox = tbox;
    publisher.initialize(this);

    /* Set up listeners that will delegate to our own events. */
    var self = this;
    tbox.on("focus", function btbFocus(evt) {
      self.publish("start", evt);
    });

    tbox.on("blur", function btbBlur(evt) {
      self.publish("finish", evt);
    });

    tbox.on("keyup", function btbKeyUp(evt) {
      var evtName = (evt.keyCode === ENTER_KEY) ? "finish" : "edit";
      /* If an edit, the change has already been made to the text, and we
       * lost the rich information on the kind of change. For now, it is not
       * important to us. */
      self.publish(evtName, evt);
    });
  };

  publisher.mixin(BetterTextbox);

  var pt = BetterTextbox.prototype;

  pt.onStartEditing = function onStartEditing(cb, context) {
    this.subscribe("start", cb, context);
  };

  pt.onEdit = function onEdit(cb, context) {
    this.subscribe("edit", cb, context);
  };

  pt.onFinishEditing = function onFinishEditing(cb, context) {
    this.subscribe("finish", cb, context);
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
    this.setText(before + insertion + after);

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
    this.setText(before + after);

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

}());

