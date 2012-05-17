/**
 * @name hotdrink.bindings.html
 * @namespace
 *   <p>
 *   Namespace for the standard HTML widget binders.
 *   </p>
 *
 *   <p>
 *   Currently includes support for the following widget types:
 *     <ul>
 *       <li>checkbox</li>
 *       <li>checkboxGroup</li>
 *       <li>radioGroup</li>
 *       <li>selectOne</li>
 *       <li>selectMany</li>
 *       <li>label</li>
 *       <li>text</li>
 *       <li>number</li>
 *       <li>command</li>
 *       <li>attr</li>
 *     </ul>
 *   </p>
 */

(function () {

  var ns = hotdrink.bindings.html;

  var extend = function extend(binders) {
    Object.extend(binders, {
      "checkbox":      ns.bindCheckbox,
      "checkboxGroup": ns.bindCheckboxGroup,
      "radioGroup":    ns.bindRadioGroup,
      "selectOne":     ns.bindSelectOne,
      "selectMany":    ns.bindSelectMany,
      "label":         ns.bindLabel,
      "text":          ns.bindText,
      "number":        ns.bindNumber,
      "command":       ns.bindCommand,
      "click":         ns.bindClick,
      "submit":        ns.bindSubmit,
      "attr":          ns.bindAttr,
      "error":         ns.bindError,
      "css":           ns.bindClass,
      "foreach":       ns.bindForEach
    });
  };

  ns.extend = extend;

}());

