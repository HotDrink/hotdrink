/**
 * @fileOverview <p>{@link concept.view.Builder}</p>
 * @author John Freeman
 */

/**
 * @name concept.view.Builder
 * @namespace
 *   <p>
 *   View builders manufacture both a visual representation (e.g. DOM Element)
 *   and controller for a view from a {@link concept.view.Ast}.
 *   </p>
 */

/**
 * @name concept.view.Builder.build
 * @description
 *   <p>
 *   Each builder is expected to produce some meaningful representation of
 *   the widget described to it.  By convention, there are two kinds of
 *   widgets: labeled (or unlabeled) form fields, and general boxes. The
 *   difference matters in layout: fields should be aligned, and boxes should
 *   occupy all available area.
 *   </p>
 *
 *   <p>
 *   Builders can pass their results to callers by augmenting the tree.
 *   By following these conventions, user-defined builders can cooperate
 *   with standard builders:
 *     <ul>
 *       <li>
 *       Fields should be stored with the label and widget kept separate:
 *       <pre>
 *       {
 *         label : \representation\,
 *         widget : \representation\
 *       }
 *       </pre>
 *       </li>
 *
 *       <li>
 *       Boxes should be stored as a single element:
 *       <pre>
 *       {
 *         box : \representation\
 *       }
 *       </pre>
 *       </li>
 *     </ul>
 *   </p>
 *
 *   <p>
 *   A builder stores a DOM element representation in the tree under the member
 *   "dom". In addition, a builder may store a
 *   {@link concept.view.Controller} in the tree under the member "view". This
 *   controller can be used later for binding the constructed widget to a
 *   model.
 *   </p>
 *
 * @static
 * @function
 * @param {concept.view.Ast} tree
 */

