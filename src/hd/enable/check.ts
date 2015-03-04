/*####################################################################
 * Enablement checking functions
 */
module hd.enable {

  import u = hd.utility;
  import g = hd.graph;

  /*==================================================================
   * Check all variables for contributing.  A variable is contributing
   * if it can reach an output variable in the current solution graph.
   * We can check all variables at once by searching backwards
   * starting with the output variables.
   *
   * Returns dictionary mapping variable id to an enablement label.
   * For a given vid, the label will be:
   *   if there is a path to an output containing only
   *          Relevant edges
   *     => Relevant
   *   else if there is a path to an output containing only
   *          Relevant and AssumedRelevant edges
   *     => AssumedRelevant
   *   else if there is a path to an output
   *     => Irrelevant
   *   else
   *     => undefined
   *
   */
  export
  function globalContributingCheck( sgraph: g.SolutionGraph,
                                    egraph: EnablementLabels,
                                    outputVids: string[]      ): u.Dictionary<Label> {
    var contributing: u.Dictionary<Label> = {};

    // Perform reverse-search for each output
    outputVids.forEach( function( vid: string ) {
      flood( vid, Label.Relevant );
    } );

    return contributing;

    /*----------------------------------------------------------------
     * Recursive searching routine.  Note that we may wind up
     * exploring a node multiple times if it has the potential to
     * improve a variables label.
     */
    function flood( vid: string, label: Label ) {
      if (label > (contributing[vid] || 0)) {
        contributing[vid] = label;

        // Travel up to any methods which output this variable
        var nextMids = sgraph.methodsWhichOutput( vid );
        for (var i = 0, l = nextMids.length; i < l; ++i) {
          var nextMid = nextMids[i];

          // Travel up to any variables which this method inputs
          var nextVids = <string[]>sgraph.inputsForMethod( nextMid );
          nextVids.sort( function( a: string, b: string ) {
            return egraph.getLabel( b, nextMid ) - egraph.getLabel( a, nextMid );
          } );
          for (var j = 0, m = nextVids.length; j < m; ++j) {
            var nextVid = nextVids[j];

            // Recurse
            var nextLabel = Math.min( label, egraph.getLabel( nextVid, nextMid ) );
            flood( nextVid, nextLabel );
          }
        }
      }
    }

  }

  /*==================================================================
   * Check a single variable for relevancy.  It's relevant if there
   * is some plan containing a path from the variable to the output
   * that does not contain any edges labeled Irrelevant in egraph.
   *
   * Note that this test can only return Yes or No.
   */
  export
  function relevancyCheck( cgraph: g.ReadOnlyConstraintGraph,
                           egraph: EnablementLabels,
                           outputVidSet: u.StringSet,
                           vid: string                        ): u.Fuzzy {

    // Map of cid -> vid
    var selected: u.Dictionary<string> = {};
    // Also used to trace our steps so that we do not select two
    //   methods from the same constraint

    return search( vid ) ? u.Fuzzy.Yes : u.Fuzzy.No;

    /*----------------------------------------------------------------
     * Recursive searching function.  We search by building a path
     * from the variable method by method until we reach an output
     * variable.  Then we make sure that we can still find a plan
     * if we enforce the methods we've followed.
     */
    function search( vid: string ) {
      if (outputVidSet[vid] && hasPlan( cgraph, selected)) {
        return true;
      }

      var nextMids = <string[]>cgraph.methodsWhichInput( vid );
      for (var i = 0, l = nextMids.length; i < l; ++i) {
        var nextMid = nextMids[i];
        var nextCid = cgraph.constraintForMethod( nextMid );

        if (! selected[nextCid] &&
            egraph.getLabel( vid, nextMid  ) !== Label.Irrelevant) {
          selected[nextCid] = nextMid;

          var nextVids = cgraph.outputsForMethod( nextMid );
          for (var j = 0, m = nextVids.length; j < m; ++j) {
            if (search( nextVids[j] )) {
              return true;
            }
          }
          selected[nextCid] = null;
        }
      }
      return false;
    }

  }

  /*==================================================================
   * Given a constraint graph and a set of methods, see if there is
   * a plan which uses those methods.
   */
  function hasPlan( cgraph: g.ReadOnlyConstraintGraph,
                    selected: u.Dictionary<string>     ) {
    var cidsLeft: u.StringSet = {};
    var numCidsLeft = 0;
    var vidCounts: u.Dictionary<number> = {};
    var freeVarQueue: string[] = [];

    initCounts();
    enforceConstraintsForAnyFreeVariables();
    return numCidsLeft == 0;

    /*----------------------------------------------------------------
     * Count up number of constraints each variable uses.  Init
     * free variable queue.
     */
    function initCounts() {
      var cids = cgraph.constraints();
      for (var i = 0, l = cids.length; i < l; ++i) {
        var cid = cids[i];
        if (g.isStayConstraint( cid )) {
          continue;
        }

        if (selected[cid]) {
          // Mark output variables so they are never considered free
          var vids = cgraph.outputsForMethod( selected[cid] );
          for (var j = 0, m = vids.length; j < m; ++j) {
            vidCounts[vids[j]] = -1;
          }
        }
        else {
          cidsLeft[cid] = true;
          ++numCidsLeft;

          var vids = cgraph.outputsForConstraint( cid );
          for (var j = 0, m = vids.length; j < m; ++j) {
            var vid = vids[j];
            var count = vidCounts[vid];
            if (count != -1) {
              vidCounts[vid] = count ? count + 1 : 1;
            }
          }
        }
      }
      freeVarQueue = <string[]>cgraph.variables().filter( isFreeVar );
    }

    /*----------------------------------------------------------------
     * Repeatedly "enforce" any constraints which have a method that
     * writes only to free variables.  We use "enforce" loosely to
     * mean adjust all counters so that it is no longer considered.
     */
    function enforceConstraintsForAnyFreeVariables() {
      while (numCidsLeft > 0 && freeVarQueue.length > 0) {
        var vid = freeVarQueue.pop();
        var cids = cgraph.constraintsWhichOutput( vid ).filter( isCidLeft );
        if (cids.length == 1) {
          var cid = cids[0];
          if (hasSelectableMethod( cid )) {
            determineConstraint( cid );
          }
        }
      }
    }

    /*----------------------------------------------------------------
     * Check whether there is at least one method in the constraint
     * that writes to only free variables.  We don't care which one
     * it is, only that it exists.
     */
    function hasSelectableMethod( cid: string ): boolean {
      var mids = cgraph.methodsForConstraint( cid );

      for (var i = 0, l = mids.length; i < l; ++i) {
        var mid = mids[i];
        var outputs = cgraph.outputsForMethod( mid );
        if (outputs.every( isFreeVar )) {
          return true;
        }
      }
      return false;
    }

    /*----------------------------------------------------------------
     * Adjust counters so that constraint no longer considered.
     */
    function determineConstraint( cid: string ) {
      cidsLeft[cid] = false;
      --numCidsLeft;

      var outputs = cgraph.outputsForConstraint( cid )
            .forEach( function( vid: string ) {
              if (--vidCounts[vid] == 1) {
                freeVarQueue.push( vid );
              }
            } );
    }

    /*----------------------------------------------------------------
     * Helper - is variable a free variable?
     */
    function isFreeVar( vid: string ): boolean {
      return vidCounts[vid] == 1;
    }

    /*----------------------------------------------------------------
     * Helper - is constraint still being considered?
     */
    function isCidLeft( cid: string ): boolean {
      return cidsLeft[cid];
    }
  }
}