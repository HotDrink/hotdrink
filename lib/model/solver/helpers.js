(function () {

  var Solver = hd.__private.Solver;

  /***************************************************************/
  /* Strength. */

  /**
   * The strengths of Constraints.
   *
   * The strongest strength value is 0 and weaker strengths have higher
   * values. */
  var Strength = {
    REQUIRED : 0,                // required (strongest) strength
    WEAKEST  : Number.MAX_VALUE, // weakest strength

    isWeaker : function isWeaker(a, b) { return a > b; },
    isStronger : function isStronger(a, b) { return a < b; },
    pickStronger : Math.min,
    pickWeaker : Math.max,

    /**
     * Removes the constraint of the strongest strength.
     * @param {[Constraint]} cnsQueue
     * @returns {Constraint} The removed element.
     */
    popStrongest : function popStrongest(cnsQueue) {
      return extractMin(cnsQueue, function (ccc) {
        return ccc.strength;
      });
    },

    /**
     * Removes the constraint of the weakest strength.
     * @param {[Constraint]} cnsQueue
     * @returns {Constraint} The removed element.
     */
    popWeakest : function popWeakest(cnsQueue) {
      return extractMax(cnsQueue, function (ccc) {
        return ccc.strength;
      });
    }
  };

  /***************************************************************/
  /* Mark. */

  /* Marks keep track of visited variables and constraints. */
  var Mark = function Mark() {
    this.upstream = Mark.INITIAL_UPSTREAM;
    this.downstream = Mark.INITIAL_DOWNSTREAM;
  };

  Mark.UKNOWN = 0;
  Mark.POTENTIALLY_UNDETERMINED = 1;
  Mark.INITIAL_UPSTREAM = 2;
  Mark.INITIAL_DOWNSTREAM = -1;

  Mark.prototype.nextUpstream = function nextUpstream() {
    if (this.upstream === Number.MAX_VALUE)
      this.upstream = Mark.INITIAL_UPSTREAM;
    return ++this.upstream;
  };

  Mark.prototype.nextDownstream = function nextDownstream() {
    if (this.downstream === -Number.MAX_VALUE)
      this.downstream = Mark.INITIAL_DOWNSTREAM;
    return --this.downstream;
  };

  /***************************************************************/
  /* Exports. */

  Solver.Strength = Strength;
  Solver.Mark     = Mark;

}());

