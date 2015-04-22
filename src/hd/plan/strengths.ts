/*====================================================================
 * A strength assignment tracks the relative strengths of different
 * constraints.  It can be used to compare two constraints, or to get
 * an entire list of all constraints in ascending order.
 *
 * It is assumed that the only constraints being tracked are
 * non-required constraints.  Thus, the strength assignment may assume
 * that any constraint it is not tracking is required.
 */
module hd.plan {

  /*==================================================================
   * This strength assignment operates by assigning a numeric value to
   * each constraint.  It is very fast at updating and at comparing
   * two constraints (since you just look up their associated
   * numbers), but slow at generating an ordered list (you would have
   * to sort a list from scratch using the comparison operator).
   */
  export class NumericStrengthAssignment {

    // Strongest strength assigned so far
    private strongest = 0;

    // Weakest strength assigned so far
    private weakest = 0;

    // Map of constraint strengths
    private strengths: {[id: string]: number} = {};

    /*----------------------------------------------------------------
     * Add/re-order individual constraints
     */

    setToMax( cid: string ): void {
      this.strengths[cid] = ++this.strongest;
    }

    setToMin( cid: string ): void {
      this.strengths[cid] = --this.weakest;
    }

    /*----------------------------------------------------------------
     * Remove an individual constraint
     */
    remove( cid: string ): void {
      delete this.strengths[cid];
    }

    /*----------------------------------------------------------------
     * Test whether a constraint is required.
     */
    isRequired( cid: string ) {
      return ! (cid in this.strengths);
    }

    /*----------------------------------------------------------------
     */
    getOptionalsUnordered() {
      return Object.keys( this.strengths );
    }

    /*----------------------------------------------------------------
     * Comparison operator
     */
    compare( cid1: string, cid2: string ): number {
      if (cid1 in this.strengths) {
        if (cid2 in this.strengths) {
          return this.strengths[cid1] - this.strengths[cid2];
        }
        else {
          return -1;
        }
      }
      else {
        if (cid2 in this.strengths) {
          return 1;
        }
        else {
          return 0;
        }
      }
    }

  }

  /*==================================================================
   * This strength assignment operates by keeping an ordered list of
   * all constraints.  It is slow at updating and at comparing two
   * constraints (since it requires a linear search of the list), but
   * fast at generating an ordered list.
   */
  export class ListStrengthAssignment<T> {

    // List of constraints from weakest to strongest
    private strengths: T[] = [];

    /*----------------------------------------------------------------
     * Add/re-order individual constraints
     */

    setToMax( cid: T ): void {
      var i = this.strengths.indexOf( cid );
      if (i >= 0) {
        this.strengths.splice( i, 1 );
      }
      this.strengths.push( cid );
    }

    setToMin( cid: T ): void {
      var i = this.strengths.indexOf( cid );
      if (i >= 0) {
        this.strengths.splice( i, 1 );
      }
      this.strengths.unshift( cid );
    }

    setOptionals( cids: T[] ) {
      this.strengths = cids;
    }

    /*----------------------------------------------------------------
     * Remove an individual constraint
     */
    remove( cid: T ): void {
      var i = this.strengths.indexOf( cid );
      if (i >= 0) {
        this.strengths.splice( i, 1 );
      }
    }

    /*----------------------------------------------------------------
     * Get all optional constraints in order from weakest to
     * strongest.
     */
    getList(): T[] {
      return this.strengths;
    }

    /*----------------------------------------------------------------
     * Comparison operator
     */
    compare( cid1: T, cid2: T ): number {
      var i1 = this.strengths.indexOf( cid1 );
      var i2 = this.strengths.indexOf( cid2 );

      if (i1 >= 0) {
        if (i2 >= 0) {
          return i1 - i2;
        }
        else {
          return -1;
        }
      }
      else{
        if (i2 >= 0) {
          return 1;
        }
        else {
          return 0;
        }
      }
    }

  }

}