/**
 * @fileOverview <p>{@link concept.view.Behavior}</p>
 * @author John Freeman
 */

/**
 * @name concept.view.Behavior
 * @namespace
 *   <p>
 *   A view behavior encapsulates function templates for handling how widgets
 *   reflect or modify information in the model. The function templates are
 *   typically higher-order functions whose arguments provide the implementation
 *   details specific to each widget type. Using this technique, a whole library
 *   of widgets can more easily get uniform support for a particular
 *   {@link concept.model.Behavior}.
 *   </p>
 */

/**
 * @name concept.view.Behavior.bindX
 * @description
 *   <p>
 *   A binder implements support for some aspect of a
 *   {@link concept.model.Behavior} by creating a link between a model and a
 *   view, typically by registering a listener.
 *   </p>
 *
 *   <p>
 *   Each binder should document its parameters. There is no standard binder
 *   interface, though some typical parameters are listed below. 
 *   </p>
 * @static
 * @function
 * @param {hotdrink.controller.ModelController} model
 * @param {concept.view.Controller} view
 * @param {Function} subprocedure
 *   Subprocedures implement the lower-level, widget-specific details of the
 *   view behavior. These are plugged into templated listeners (or other
 *   functions) that implement a binding between model and view.
 */

