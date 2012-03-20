/**
 * @fileOverview <p>{@link concept.view.Ast}</p>
 * @author John Freeman
 */

/**
 * @name concept.view.Ast
 * @namespace
 *   <p>
 *   This AST is the result of parsing an Eve specification with
 *   {@link hotdrink.parser.ViewParser}.
 *   </p>
 *
 *   <p>
 *   Each node in the AST should have all of the information necessary for
 *   building a widget of the node type. That is, the connection between any two
 *   nodes, even between parent and child, must be loose. This way, widget
 *   builders and binders can be defined modularly. Typically, only container
 *   widgets will have children.
 *   </p>
 *
 *   <pre>
 *   ViewAst ::=
 *   {
 *     type : /widget-type-name/,
 *     options : {
 *       /name/ : /value/,
 *       ...
 *     },
 *     children? : [ViewAst]
 *   }
 *   </pre>
 */

