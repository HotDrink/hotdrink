/**
 * @fileOverview <p>{@link concept.view.Controller}</p>
 * @author John Freeman
 */

/**
 * @name concept.view.Controller
 * @class
 *   A view controller is a bounded abstract data type that handles all of the
 *   binding for a widget or group of widgets. Where the difference is either
 *   trivial or non-existent, the term "widget" below refers similarly to both
 *   single widgets and widget groups.
 * @constructor
 * @param {Object} element
 *   The widget that this instance will control.
 * @description
 *   Simply stores a reference to the controlled widget.
 */

/**
 * @name concept.view.Controller#identify
 * @function
 * @returns {String}
 * @description
 *   Returns a unique identifier for the widget. Will generate one if none
 *   exists.
 */

/**
 * @name concept.view.Controller#bind
 * @function
 * @param {hotdrink.controller.ModelController} model
 * @param {Hash} options
 * @description
 *   Binds the widget to the model according to the options. Will probably
 *   employ {@link concept.view.Behavior}s.
 */

