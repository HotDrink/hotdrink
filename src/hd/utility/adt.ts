/*####################################################################
 * Abstract Data Type interfaces
 *
 * These are mainly interfaces defining how to use the built-in
 * JavaScript types to emulate more complex types.  For example, the
 * Dictionary interface just describes an object in which name/value
 * pairs are stored as properties.  Similarly, the ArraySet interface
 * just describes an array in which every element is assumed to be
 * unique.
 */
module hd.utility {

  /*==================================================================
   */
  export
  interface Point {
    x: number;
    y: number;
  }

  /*==================================================================
   * An object whose sole purpose is to store string/value pairs.
   */
  export interface Dictionary<T> {
    [key: string]: T;
  }

  /*==================================================================
   * The standard Array interface, pared back to only support
   * operations that make sense on a set.
   */
  export interface ArraySet<T> {
    [key: number]: T;
    length: number;
    every( callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any ): boolean;
    filter( callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any ): ArraySet<T>;
    forEach( callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any ): void;
    indexOf(searchElement: T, fromIndex?: number): number;
    join( separator?: string ): string;
    map<U>( callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any ): U[];
    reduce( callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue?: T ): T;
    reduce<U>( callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U ): U;
    reduceRight( callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue?: T ): T;
    reduceRight<U>( callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U ): U;
    some( callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any ): boolean;
  }

  /*==================================================================
   * An ArraySet is simply an array where each element only occurs
   * in the array once.
   *
   * To make this, I copied from the standard "lib.d.ts" definitions
   * file all the members of the "Array" interface which make sense on
   * a set.  Thus, any array will automatically fuffill this
   * interface.
   *
   * Extra set functionality is provided through external functions.
   *
   * All ArraySet functions are in their own namespace to avoid
   * confusion.
   */
  export module arraySet {

    /*----------------------------------------------------------------
     * Make a copy.
     */
    export function clone<T>( as: ArraySet<T> ): ArraySet<T> {
      return (<T[]>as).slice( 0 );
    }

    /*----------------------------------------------------------------
     * Test whether set contains element.
     */
    export function contains<T>( as: ArraySet<T>, value: T ): boolean {
      return (<T[]>as).indexOf( value ) != -1;
    }

    /*----------------------------------------------------------------
     * Add element to set.
     * @returns the set
     * Useful with Array.reduce -- e.g.
     *   set = [3, 1, 4, 1, 5, 9, 3].reduce( arraySet.build, [] )
     */
    export function build<T>( as: ArraySet<T>, value: T ): ArraySet<T> {
      if ((<T[]>as).indexOf( value ) == -1) {
        (<T[]>as).push( value );
      }
      return as;
    }

    /*----------------------------------------------------------------
     * Add element to set.
     * @returns true if element was added, false if it was already
     * contained by the set
     */
    export function add<T>( as: ArraySet<T>, value: T ): boolean {
      if ((<T[]>as).indexOf( value ) == -1) {
        (<T[]>as).push( value );
        return true;
      }
      else {
        return false;
      }
    }

    export function addKnownDistinct<T>( as: ArraySet<T>, value: T ) {
      (<T[]>as).push( value );
    }

    /*----------------------------------------------------------------
     * Remove element from set.
     * @returns true if element was removed, false if it was not
     * contained by the set.
     */
    export function remove<T>( as: ArraySet<T>, value: T ): boolean {
      var index = (<T[]>as).indexOf( value );
      if (index != -1) {
        (<T[]>as).splice( index, 1 );
        return true;
      }
      else {
        return false;
      }
    }

    /*----------------------------------------------------------------
     * Calculate the union of two sets.
     */
    export function union<T>( as: ArraySet<T>, bs: ArraySet<T> ): ArraySet<T> {
      return (<T[]>as).concat(
        (<T[]>bs).filter( function( b: T ) {
          return (<T[]>as).indexOf( b ) == -1;
        } )
      );
    }

    /*----------------------------------------------------------------
     * Optimization for when we know the sets are disjoint to begin
     * with.
     */
    export function unionKnownDisjoint<T>( as: ArraySet<T>, bs: ArraySet<T> ): ArraySet<T> {
      return (<T[]>as).concat( <T[]>bs );
    }

    /*----------------------------------------------------------------
     * Calculate the intersection of two sets.
     */
    export function intersect<T>( as: ArraySet<T>, bs: ArraySet<T> ): ArraySet<T> {
      return (<T[]>as).filter( function( a: T ) {
        return (<T[]>bs).indexOf( a ) != -1;
      } );
    }

    /*----------------------------------------------------------------
     * Calculate set difference.
     */
    export function difference<T>( as: ArraySet<T>, bs: ArraySet<T> ): ArraySet<T> {
      return (<T[]>as).filter( function( a: T ) {
        return (<T[]>bs).indexOf( a ) == -1;
      } );
    }

    /*----------------------------------------------------------------
     * Test for subset relation.
     */
    export function isSubset<T>( as: ArraySet<T>, bs: ArraySet<T> ): boolean {
      return (<T[]>as).every( function( a: T ) {
        return (<T[]>bs).indexOf( a ) != -1;
      } );
    }

    /*----------------------------------------------------------------
     * Build set from array (remove duplicates).
     */
    export function fromArray<T>( as: T[] ): ArraySet<T> {
      // For some reason, TypeScript does not infer this type correctly
      var b = <(as: ArraySet<T>, t: T) => ArraySet<T>>build;

      var f = as.reduce( b, [] );
      return f;
    }
  }

  /*==================================================================
   * Using an object to store strings, as the property names.
   */
  export interface StringSet {
    [key: string]: boolean;
  }

  /*==================================================================
   * A StringSet is simply an object used to store strings as property
   * names.  Since the value of the property does not matter, only the
   * property name, the boolean value "true" is used as the value;
   * this has the added bonus of simplifying the membership test.
   *
   * Extra set functionality is provided through external functions.
   *
   * All StringSet functions are in their own namespace to avoid
   * confusion.
   */
  export module stringSet {

    /*----------------------------------------------------------------
     * Make a copy.
     */
    export function clone( ss: StringSet ): StringSet {
      var copy: StringSet = {};
      for (var s in ss) {
        if (ss[s]) {
          copy[s] = true;
        }
      }
      return copy;
    }

    /*----------------------------------------------------------------
     * Test whether set contains element.
     */
    export function contains( ss: StringSet, s: string ): boolean {
      return ss[s];
    }

    /*----------------------------------------------------------------
     * Add element to set.
     * @returns the set
     * Useful with Array.reduce -- e.g.
     *   set = ['hey', 'there', 'hi', 'there'].reduce( stringSet.build, [] )
     */
    export function build( ss: StringSet, s: string ): StringSet {
      ss[s] = true;
      return ss;
    }

    /*----------------------------------------------------------------
     * Add element to set.
     * @returns true if element was added, false if it was already
     * contained by the set
     */
    export function add( ss: StringSet, s: string ): boolean {
      if (ss[s]) {
        return false;
      }
      else {
        return ss[s] = true;
      }
    }

    /*----------------------------------------------------------------
     * Remove element from set.
     * @returns true if element was removed, false if it was not
     * contained by the set.
     */
    export function remove( ss: StringSet, s: string ): boolean {
      if (ss[s]) {
        delete ss[s];
        return true;
      }
      else {
        return false;
      }
    }

    /*----------------------------------------------------------------
     * Gets all members of the set.
     */
    export var members = Object.keys;

    /*----------------------------------------------------------------
     * Iteration
     */
    export function forEach( ss: StringSet,
                             callback: (el: string) => void,
                             thisArg: any = null             ) {
      for (var el in ss) {
        callback.call( thisArg, el );
      }
    }

    /*----------------------------------------------------------------
     * Calculate the union of two sets.
     */
    export function union( as: StringSet, bs: StringSet ): StringSet {
      var cs: StringSet = {};
      for (var el in as) {
        cs[el] = true;
      }
      for (var el in bs) {
        cs[el] = true;
      }
      return cs;
    }

    /*----------------------------------------------------------------
     * Calculate the intersection of two sets.
     */
    export function intersect<T>( as: StringSet, bs: StringSet ): StringSet {
      var cs: StringSet = {};
      for (var el in as) {
        if (bs[el]) {
          cs[el] = true;
        }
      }
      return cs;
    }

    /*----------------------------------------------------------------
     * Calculate set difference.
     */
    export function difference( as: StringSet, bs: StringSet ): StringSet {
      var cs: StringSet = {};
      for (var el in as) {
        if (! (el in bs)) {
          cs[el] = true;
        }
      }
      return cs;
    }

    /*----------------------------------------------------------------
     * Build set from list of strings.
     */
    export function fromArray( as: string[] ): StringSet {
      return as.reduce( build, <StringSet>{} );
    }
  }

  /*==================================================================
   * This is a very simple queue implementation, basically storing
   * everything as an array with a varying initial index.
   */
  export class Queue<T> {
    private begin = 0;
    private end = 0;

    [key: number]: T;

    /*----------------------------------------------------------------
     */
    isEmpty(): boolean {
      return this.begin == this.end;
    }

    /*----------------------------------------------------------------
     */
    isNotEmpty(): boolean {
      return this.begin != this.end;
    }

    /*----------------------------------------------------------------
     */
    enqueue( t: T ): void {
      this[this.end++] = t;
    }

    /*----------------------------------------------------------------
     */
    dequeue(): T {
      var t = this[this.begin];
      this[this.begin] = undefined;
      ++this.begin;
      if (this.begin >= this.end) {
        this.begin = this.end = 0;
      }
      return t;
    }

    /*----------------------------------------------------------------
     */
    remove( t: T ): void {
      var removed = false;
      for (var i = this.begin, l = this.end; i < l; ++i) {
        if (! removed && this[i] === t ) {
          removed = true;
        }
        if (removed) {
          this[i] = this[i + 1];
        }
      }
      if (removed) {
        --this.end;
        if (this.begin >= this.end) {
          this.begin = this.end = 0;
        }
      }
    }

  }

  /*==================================================================
   */

  export class Heap<T> {

    members: T[] = [];

    comesBefore: (a: T, b: T) => boolean;

    length = 0;

    constructor( comesBefore: (a: T, b: T) => boolean ) {
      this.comesBefore = comesBefore;
    }

    contains( el: T ): boolean {
      return this.members.indexOf( el ) >= 0;
    }

    push( el: T ) {
      this.members.push( el );
      this.upheap( this.length );
      ++this.length;
    }

    pushAll( els: T[] ): void;
    pushAll( els: ArraySet<T> ): void;
    pushAll( els: T[] ) {
      for (var i = 0, l = els.length; i < l; ++i) {
        this.members.push( els[i] );
        this.upheap( this.length );
        ++this.length;
      }
    }

    pop(): T {
      var result = this.members[0];
      var last = this.members.pop();
      if (--this.length > 0) {
        this.members[0] = last;
        this.downheap( 0 );
      }
      return result;
    }

    private upheap( i: number ) {
      var el = this.members[i];
      while (i > 0) {
        var parentI = Math.floor( (i + 1)/2 ) - 1;
        var parent = this.members[parentI];
        if (this.comesBefore( el, parent )) {
          this.members[parentI] = el;
          this.members[i] = parent;
          i = parentI;
        }
        else {
          break;
        }
      }
    }

    private downheap( i: number ) {
      var length = this.members.length;
      var el = this.members[i];
      while (true) {
        var childI = 2*i + 1;
        if (childI < length) {
          var child = this.members[childI];
          var child2I = childI + 1;
          if (child2I < length) {
            var child2 = this.members[child2I];
            if (this.comesBefore( child2, child )) {
              childI = child2I;
              child = child2;
            }
          }

          if (this.comesBefore( child, el )) {
            this.members[childI] = el;
            this.members[i] = child;
            i = childI;
          }
          else {
            break;
          }
        }
        else {
          break;
        }
      }
    }

  }

}