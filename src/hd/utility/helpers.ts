/*####################################################################
 * Stand-alone helper functions, as well as a few generic interfaces.
 */
module hd.utility {

  /*------------------------------------------------------------------
   * There doesn't seem to be a built-in type for this.
   */

  export interface Constructor {
    new ( ...args: any[] ): any;
  }

  export interface Class<T> {
    new (...args: any[]): T;
    name?: string;
  }

  /*------------------------------------------------------------------
   * Makes a "construction binder" - a function which takes its
   * arguments and binds them to a constructor, making a specialized
   * constructor.
   *
   * So this:
   *   fBinder = makeConstructionBinder( F );
   *   Fxy = fBinder( x, y );
   *   Fab = fBinder( a, b );
   *   f1 = new Fxy();
   *   f2 = new Fab();
   * is effectively the same as this:
   *   f1 = new F( x, y );
   *   f2 = new F( a, b );
   */
  export function makeConstructorBinder( klass: Constructor,
                                         ...args: any[]
                                       ): (...args: any[]) => Constructor {
    var arg1 = Array.prototype.slice.call( arguments, 1 );
    return function() {
      var arg2 = Array.prototype.slice.call( arguments, 0 );
      return klass.bind.apply( klass, (<any[]>[null]).concat( arg1, arg2 ) );
    }
  }

  /*------------------------------------------------------------------
   * Interface for an equality predicate.
   */
  export interface EqualityPredicate<T> {
    ( left: T, right: T ): boolean;
  }

  export enum Fuzzy { No = 0, Yes = 1, Maybe = 2 };

  /*------------------------------------------------------------------
   * Does nothing.  Reuse this to avoid creating a bunch of empty
   * functions.
   */
  export function noop() { }

  /*------------------------------------------------------------------
   * Creates a duplicate of an object.  Note that this is a shallow
   * copy:  it's an object with the same prototype whose properties
   * point to the same values.
   */
  export function shallowCopy<T>( obj: T ): T {
    var orig: Dictionary<any> = <any>obj;
    var copy: Dictionary<any> = Object.create( Object.getPrototypeOf( obj ) );
    for (var key in orig) {
      if (orig.hasOwnProperty( key )) {
        copy[key] = (orig)[key];
      }
    }
    return <any>copy;
  }

  /*------------------------------------------------------------------
   * Creates a duplicate of an object.  Note that this is a deep
   * copy:  it will recursively copy any objects pointed to by this
   * object.  (So make sure there are no cycles.)
   */
  export function deepCopy<T>( obj: T ): T {
    var orig: Dictionary<any> = <any>obj;
    var copy: Dictionary<any> = Array.isArray( obj )
          ? [] : Object.create( Object.getPrototypeOf( obj ) );
    for (var key in orig) {
      if (orig.hasOwnProperty( key )) {
        if (typeof orig[key] === 'object') {
          copy[key] = deepCopy( orig[key] );
        }
        else {
          copy[key] = orig[key];
        }
      }
    }
    return <any>copy;
  }

  /*------------------------------------------------------------------
   */
  export function partition<T>( ts: T[], fn: (t: T) => any ): Dictionary<T[]> {
    return ts.reduce( function build( d: Dictionary<T[]>, t: T ) {
      var key = fn( t );
      if (key in d) {
        d[key].push( t );
      }
      else {
        d[key] = [t];
      }
      return d;
    }, <Dictionary<T[]>>{} );
  }

  /*------------------------------------------------------------------
   * Map function over array and concatenate the results
   */
  export function concatmap<T, U>( ts: ArraySet<T>,
                                   fn: (t: T,
                                        i: number,
                                        ts: ArraySet<T>) => ArraySet<U>,
                                   thisArg: Object = null                 ): U[] {
    var results: U[] = [];
    for (var i = 0, l = ts.length; i < l; ++i) {
      var result = fn.call( thisArg, ts[i], i, ts );
      Array.prototype.push.apply( results, Array.isArray(result) ? result : [result] );
    }
    return results;
                                   }

  /*------------------------------------------------------------------
   * Map function over array in reverse order
   */
  export function reversemap<T, U>( ts: ArraySet<T>,
                                    fn: (t: T, i: number, ts: ArraySet<T>) => U,
                                    thisArg: Object = null                       ): U[] {
    var results: U[] = [];
    for (var i = ts.length - 1; i >= 0; --i) {
      results.push( fn.call( thisArg, ts[i], i, ts ) );
    }
    return results;
  }

  /*------------------------------------------------------------------
   * Interpolate arguments into single list.
   * interpolate<T> takes any number of arguments of type T or T[].
   * It returns a T[] consisting of the individual T elements
   * (removing any which are undefined) and the elements of each T[].
   * It does /not/ recurse, so any undefined elements in a T[] remain,
   * as do any arrays found inside a T[].
   */
  export function interpolate( ...args: any[] ): any[];
  export function interpolate() {
    var as: any[] = [];
    for (var i = 0, l = arguments.length; i < l; ++i) {
      var a = arguments[i];
      if (Array.isArray( a )) {
        as.push.apply( as, a );
      }
      else if (a !== undefined) {
        as.push( a );
      }
    }
    return as;
  }

  /*------------------------------------------------------------------
   * The compare function for numbers (most commonly used for sorting)
   */
  export function numCompare( a: number, b: number ) {
    return a - b;
  }

  export function dateCompare( a: Date, b: Date ) {
    return a.valueOf() - b.valueOf();
  }

  /*==================================================================
    The following functions are all simple functions intended to be
    used with the built-in array iteration functions
    (e.g. filter, map, etc.)
   *==================================================================*/

  /*------------------------------------------------------------------
   * Simple predicates to test type of object.  Written in curried
   * form.
   */
  export function isType( type: Constructor ) {
    return function( obj: any ) {
      return obj instanceof type;
    }
  }

  export function isNotType( type: Constructor ) {
    return function( obj: any ) {
      return ! (obj instanceof type);
    }
  }

  /*------------------------------------------------------------------
   * Simple predicates to test for key in object.  Written in curried
   * form.
   */
  export function nameIsIn( obj: Object ) {
    return function( name: string ) {
      return name in obj;
    }
  }

  export function nameIsNotIn( obj: Object ) {
    return function( name: string ) {
      return ! (name in obj);
    }
  }

  /*----------------------------------------------------------------
   * Simple function to get property with given name.  Written in
   * curried form.
   */
  export function toValueIn<T>( obj: Dictionary<T> ): (name: string) => T {
    return function( name: string ) {
      return obj[name];
    }
  }

  /*------------------------------------------------------------------
   * Simple function to get the id property of an object.
   */
  export function getId( obj: {id: string} ) {
    return obj.id;
  }

}
