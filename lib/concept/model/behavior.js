/**
 * @fileOverview <p>{@link concept.model.Behavior}</p>
 * @author John Freeman
 */

/**
 * @name concept.model.Behavior
 * @class
 *   <p>
 *   A model behavior encapsulates an algorithm that computes metrics on a
 *   {@link hotdrink.Model}, and a data structure for holding that information. The
 *   information can be used to support a feature in a user interface, for
 *   example.
 *   </p>
 *
 *   <p>
 *   An object of a class that models {@link concept.model.Behavior} should be
 *   an instance of the encapsulated data structure. It should follow a
 *   structure similar to the three fundamental graphs - three collections, one
 *   each for variables, methods, and constraints, with member objects indexed
 *   by name and containing relevant sets of properties:
 *   </p>
 *   <pre>
 *   {
 *     variables : {
 *       /variable-name/ : {
 *         ...
 *       },
 *       ...
 *     },
 *     methods : {
 *       /method-name/ : {
 *         ...
 *       },
 *       ...
 *     },
 *     constraints : {
 *       /constraint-name/ : {
 *         ...
 *       },
 *       ...
 *     }
 *   }
 *   </pre>
 *
 *   <p>
 *   The three fundamental graphs ({@link hotdrink.graph.CGraph},
 *   {@link hotdrink.graph.SGraph}, {@link hotdrink.graph.EGraph}) nearly model
 *   {@link concept.model.Behavior}. The primary difference is that they take
 *   different parameters to their methods.
 *   </p>
 * @constructor
 * @param {hotdrink.Model} model
 * @description
 *   Builds the encapsulated data structure, but may not initalize it. A model
 *   of {@link concept.model.Behavior} should never be inspected before
 *   {@link concept.model.Behavior#update} is called.
 */

/**
 * @name concept.model.Behavior#update
 * @function
 * @param {hotdrink.Model} model
 * @returns {String[]} List of change events.
 * @description
 *   <p>
 *   Calculates all information exposed by the behavior, and returns a list
 *   describing certain changes in which clients may be interested.
 *   </p>
 *
 *   <p>
 *   Each string in the returned list should describe an observed event.  For
 *   example, if a variable's value has changed, the list could contain a string
 *   like "variable.value". Each behavior should document its own events.
 *   </p>
 *
 *   <p>
 *   NOTE: only a notification of the event appears in the list; values of
 *   changed attributes will have to be inspected separately.
 *   </p>
 */

