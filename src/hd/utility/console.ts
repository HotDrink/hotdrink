/*####################################################################
 * Defines hd.utility.console for logging.
 *
 * This is a duplicate of window.console, with the addition that there
 * are certain content-specific consoles which can be either enabled
 * or disabled.  If they are disabled, then the logging functions are
 * still there, but they don't do anything.
 *
 * For example:
 *   // Always prints to console
 *   hd.utility.console.log( 'Hello' );
 *
 *   // Only prints if the "async" logger is enabled; otherwise no-op
 *   hd.utility.console.async.log( 'Hello' );
 *
 *   // Prints if at least one of "async", "solve", or "promise" is enabled
 *   hd.utility.console.async.solve.promise.log( 'Hello' );
 */

module hd {
  export declare var globalConsole : Console;
}

hd.globalConsole = console;

module hd.utility {

  /*==================================================================
   * This class has two types of members.  First it has all the
   * logging functions from window.console.  Second it has links
   * to various content-specific consoles.
   */
  export class Console {

    // logging functions

    dir:
    {( obj: Object ): void} = noop;

    error:
    {( msg: any, ...extra: any[] ): void} = noop;

    group:
    {( name: string ): void} = noop;

    groupCollapsed:
    {( name: string ): void} = noop;

    groupEnd:
    {( name: string ): void} = noop;

    info:
    {( msg: any, ...extra: any[] ): void} = noop;

    log:
    {( msg: any, ...extra: any[] ): void} = noop;

    time:
    {( name: string ): void} = noop;

    timeEnd:
    {( name: string ): void} = noop;

    trace:
    {(): void} = noop;

    warning:
    {( msg: any, ...extra: any[] ): void} = noop;

    // content-specific consoles

    async:    Console = this;
    compile:  Console = this;
  }

  /*==================================================================
   * There are three consoles: the root console, the enabled console,
   * and the disabled console.
   */

  /*
   * The root console:
   * - Console functions come from window.console
   * - Enabled links point to enabled console
   * - Disabled links point to disabled console
   */
  export var console = new Console();

  /*
   * The enabled console:
   * - Console functions come from window.console
   * - Enabled links point to enabled console
   * - Dsiabled links point to enabled console
   */
  var enabled = new Console();

  /*
   * The disabled console:
   * - Console functions are noop
   * - Enabled links point to enabled console
   * - Disabled links point to disabled console
   */
  var disabled = new Console();

  // This helper function creates a bound version of a specific
  // window.console function
  function bindConsoleFunction( name: string ): any {
    var consoleFns: Dictionary<Function> = <any>hd.globalConsole;
    if (consoleFns[name]) {
      return consoleFns[name].bind( hd.globalConsole );
    }
  }

  // Set console functions for root/enabled consoles
  console.dir = enabled.dir =
        bindConsoleFunction( 'dir' );
  console.error = enabled.error =
        bindConsoleFunction( 'error' );
  console.group = enabled.group =
        bindConsoleFunction( 'group' );
  console.groupCollapsed = enabled.groupCollapsed =
        bindConsoleFunction( 'groupCollapsed' );
  console.groupEnd = enabled.groupEnd =
        bindConsoleFunction( 'groupEnd' );
  console.info = enabled.info =
        bindConsoleFunction( 'info' );
  console.log = enabled.log =
        bindConsoleFunction( 'log' );
  console.time = enabled.time =
        bindConsoleFunction( 'time' );
  console.timeEnd = enabled.timeEnd =
        bindConsoleFunction( 'timeEnd' );
  console.trace = enabled.trace =
        bindConsoleFunction( 'trace' );
  console.warning = enabled.warning =
        bindConsoleFunction( 'warning' );


  // Set console links for root/disabled
  enableConsole( 'async' );
  disableConsole( 'compile' );

  /*------------------------------------------------------------------
   * Enable a content-specific console
   */
  export function enableConsole( name: string ): void {
    (<Dictionary<Console>><any>console)[name] =
          (<Dictionary<Console>><any>disabled)[name] = enabled;
  }

  /*------------------------------------------------------------------
   * Disable a content-specific console
   */
  export function disableConsole( name: string ): void {
    (<Dictionary<Console>><any>console)[name] =
          (<Dictionary<Console>><any>disabled)[name] = disabled;
  }

}