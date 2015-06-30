/*####################################################################
 * Planner using the QuickPlan algorithm.
 */
module hd.plan {

  import u = hd.utility;
  import g = hd.graph;

  /*==================================================================
   * The planner object.
   */
  export class QuickPlanner {

    // The constraint graph we are planning for
    private cgraph: g.ReadOnlyConstraintGraph;

    // The solution graph from last plan
    private sgraph: g.SolutionGraph;

    // The strength assignment
    private strengths = new NumericStrengthAssignment();

    /*----------------------------------------------------------------
     * Initialize from constraint graph.  Set all constraints to
     * be enforced.
     */
    constructor( cgraph: g.ReadOnlyConstraintGraph ) {
      this.cgraph = cgraph;
    }

    /*----------------------------------------------------------------
     * Get list of optional constraints only in order from weakest
     * to strongest.
     */
    getOptionals() {
      var cids = this.strengths.getOptionalsUnordered();
      cids.sort( this.strengths.compare.bind( this.strengths ) );
      return cids;
    }

    /*----------------------------------------------------------------
     * Reset all constraint strengths according to provided order from
     * weakest to strongest.  Any constraints not in the list are
     * assumed to be required.
     */
    setOptionals( order: string[] ) {
      this.strengths = new NumericStrengthAssignment();
      order.forEach( this.strengths.setToMax, this.strengths );
    }

    /*----------------------------------------------------------------
     * Remove single constraint from consideration.
     */
    removeOptional( cid: string ) {
      this.strengths.remove( cid );
    }

    /*----------------------------------------------------------------
     * Make constraint optional (if it isn't already) and give it the
     * highest strength of all optional constraints.
     */
    setMaxStrength( cid: string ) {
      this.strengths.setToMax( cid );
    }

    /*----------------------------------------------------------------
     * Make constraint optional (if it isn't already) and give it the
     * lowest strength of all optional constraints.
     */
    setMinStrength( cid: string ) {
      this.strengths.setToMin( cid );
      // TODO: What needs to be resolved?
    }

    /*----------------------------------------------------------------
     */
    compare( cid1: string, cid2: string ): number {
      return this.strengths.compare( cid1, cid2 );
    }

    /*----------------------------------------------------------------
     * Run planning algorithm; return true if planning succeeded.
     * Updates internal solution graph.
     */
    plan( oldSGraph: g.SolutionGraph, cidsToEnforce: string[] ): boolean {
      // Build a new QP solution graph that equals cgraph intersect sgraph
      var qpsgraph = this.sgraph = new QPSolutionGraph();
      this.cgraph.variables().forEach( qpsgraph.addVariable, qpsgraph );
      if (oldSGraph) {
        this.cgraph.constraints().forEach( function( cid: string ) {
          var mid = oldSGraph.selectedForConstraint( cid );
          if (mid) {
            qpsgraph.addMethod( mid,
                                cid,
                                this.cgraph.inputsForMethod( mid ),
                                this.cgraph.outputsForMethod( mid )
                              );
          }
        }, this );
      }

      var qp = new QuickPlan( this.cgraph,
                              this.strengths,
                              qpsgraph,
                              cidsToEnforce
                            );
      return qp.run();
    }

    /*----------------------------------------------------------------
     * Get solution graph from last successful plan.
     */
    getSGraph(): g.SolutionGraph {
      return this.sgraph;
    }

  }

  /*================================================================
   * This class extends CachingSolutionGraph by keeping track of the
   * changes made and allowing them to be undone (using a typical
   * commit/rollback scheme).
   */
  interface TransactionalSolutionGraph extends g.SolutionGraph {
    commit(): void;
    rollback(): void;
  }

  interface SolutionGraphChange {
    mid: string;
    inputs: u.ArraySet<string>;
    outputs: u.ArraySet<string>;
  }

  export class QPSolutionGraph extends g.CachingSolutionGraph {

    // changes since last commit
    private changes: u.Dictionary<SolutionGraphChange> = {};

    /*----------------------------------------------------------------
     * Make change to the graph
     */
    selectMethod( cid: string,
                  mid: string,
                  inputs: u.ArraySet<string>,
                  outputs: u.ArraySet<string> ) {
      var oldmid = this.selectedForConstraint( cid );
      if (oldmid != mid) {

        // record the change
        if (cid in this.changes) {
          if (this.changes[cid].mid == mid) {
            delete this.changes[cid];
          }
        }
        else {
          this.changes[cid] = {mid: oldmid,
                               inputs: oldmid ? this.inputsForMethod( oldmid ) : null,
                               outputs: oldmid ? this.outputsForMethod( oldmid ) : null
                              };
        }

        // make the switch
        super.selectMethod( cid, mid, inputs, outputs );
      }
    }

    /*----------------------------------------------------------------
     * Rollback any changes since the last commit.
     */
    rollback() {
      for (var cid in this.changes) {
        super.selectMethod( cid,
                            this.changes[cid].mid,
                            this.changes[cid].inputs,
                            this.changes[cid].outputs
                          );
      }
      this.changes = {};
    }

    /*----------------------------------------------------------------
     * Commit all changes since the last commit
     * (by forgetting about them).
     */
    commit() {
      this.changes = {};
    }

  }

  /*==================================================================
   * Performs one part of the Quick Plan algorithm:  enforce a
   * single constraint by retracting weaker constraints until it can
   * be enforced.
   */
  class QPSingle {

    // Target constraint
    private cidToEnforce: string;

    // Subgraph of the constraint graph == just the constraints being considered
    private subcgraph: g.ConstraintGraph;

    // Current constraint strengths
    private strengths: NumericStrengthAssignment;

    // Current solution graph
    private sgraph: TransactionalSolutionGraph;

    // Worklist of free variables
    private freeVarQueue: string[];

    // Min-heap of retractable constraints (i.e. weaker than cidToEnforce)
    private retractableCids: u.Heap<string>;

    // Strongest constraint which has been retracted so far
    private strongestRetractedCid: string = null;

    // Any variables which we have made undetermined (not output by any method)
    // by modifying constraints
    private undeterminedVids: u.StringSet = {};

    /*----------------------------------------------------------------
     * Initialize members.
     */
    constructor( cidToEnforce: string,
                 fullcgraph: g.ReadOnlyConstraintGraph,
                 strengths: NumericStrengthAssignment,
                 sgraph: TransactionalSolutionGraph     ) {

      this.cidToEnforce = cidToEnforce;
      this.strengths = strengths;
      this.sgraph = sgraph;

      // Copy the subgraph we will be considering
      var upstreamConstraints = new g.DigraphWalker( sgraph.graph )
            .nodesUpstreamOtherType(
              fullcgraph.variablesForConstraint( cidToEnforce )
            )
            .map( fullcgraph.constraintForMethod, fullcgraph );
      var copyFromFull = copyConstraintsFrom( fullcgraph );
      this.subcgraph = new g.CachingConstraintGraph();
      this.subcgraph = upstreamConstraints.reduce( copyFromFull, this.subcgraph );
      this.subcgraph = copyFromFull( this.subcgraph, cidToEnforce );

      // Find retractable constraints
      this.retractableCids = new u.Heap<string>(
        function( cid1: string, cid2: string ) {
          return strengths.compare( cid1, cid2 ) < 0;
        }
      );
      this.retractableCids.pushAll(
        this.subcgraph.constraints().filter( this.isRetractable, this )
      );

      // Initialize free variable queue
      this.freeVarQueue =
            <string[]>this.subcgraph.variables().filter( this.isFreeVar, this );
    }

    /*----------------------------------------------------------------
     * Check to see if planning has succeeded yet.
     */
    targetConstraintSatisfied(): boolean {
      return this.sgraph.selectedForConstraint( this.cidToEnforce ) !== null;
    }

    /*----------------------------------------------------------------
     * Geter for strongest retracted constraint
     */
    getStrongestRetractedCid(): string {
      return this.strongestRetractedCid;
    }

    /*----------------------------------------------------------------
     * Getter for undetermined variables
     */
    getUndeterminedVids(): string[] {
      return u.stringSet.members( this.undeterminedVids );
    }

    /*----------------------------------------------------------------
     * Attempt to enforce target constraint by repeatedly enforcing
     * constraints for any free variables, then retracting weaker
     * constraints (hopefully freeing more variables).
     */
    run(): boolean {

      this.enforceConstraintsForAnyFreeVariables();

      // Keep retracting as long as their are weaker constraints
      while (! this.targetConstraintSatisfied() &&
             this.retractableCids.length > 0      ) {

        // Retract
        var retractCid = this.retractableCids.pop();
        this.determineConstraint( retractCid, null );
        this.enforceConstraintsForAnyFreeVariables();

      }

      // Did it work?
      if (this.targetConstraintSatisfied()) {
        this.sgraph.commit();
        return true;
      }
      else {
        this.sgraph.rollback();
        return false;
      }
    }

    /*----------------------------------------------------------------
     * Attempt to enforce constraints for any free variables by
     * selecting the method that outputs to it.
     */
    private enforceConstraintsForAnyFreeVariables(): void {

      while (! this.targetConstraintSatisfied() &&
             this.freeVarQueue.length > 0) {

        var vid = this.freeVarQueue.pop();
        var cids = this.subcgraph.constraintsWhichOutput( vid );
        if (cids.length == 1) { // note: length could be 0
          var cid = cids[0];
          var mid = this.bestSelectableMethod( cid );
          if (mid) {
            this.determineConstraint( cid, mid );
          }
        }

      }
    }

    /*----------------------------------------------------------------
     * Return the method from the specified constraint which only
     * outputs to free variables.  If more than one is found,
     * returns the one with the fewest outputs.
     */
    private bestSelectableMethod( cid: string ): string {
      var mids = this.subcgraph.methodsForConstraint( cid );
      var best: string = null;
      var bestCount = 0;

      mids.forEach( function( mid: string ) {
        var outputs = this.subcgraph.outputsForMethod( mid );
        if (outputs.every( this.isFreeVar, this )) {
          if (best === null || bestCount > outputs.length) {
            best = mid;
            bestCount = outputs.length;
          }
        }
      }, this );

      return best;
    }

    /*----------------------------------------------------------------
     * Set constraint in the solution graph -- either to a selected
     * method, or to null if it's being retracted
     */
    private determineConstraint( cid: string, mid: string ) {

      // Outputs of the old method become undetermined
      var oldmid = this.sgraph.selectedForConstraint( cid );
      if (oldmid) {
        this.sgraph.outputsForMethod( oldmid )
              .forEach( this.makeUndetermined, this );
      }

      // Make the switch
      this.sgraph.selectMethod( cid,
                                mid,
                                this.subcgraph.inputsForMethod( mid ),
                                this.subcgraph.outputsForMethod( mid )
                              );

      // Outputs of the new method are no longer undetermined
      if (mid) {
        this.sgraph.outputsForMethod( mid )
              .forEach( this.makeDetermined, this );
      }

      // Remove constraint from constraint graph
      var outputs = this.subcgraph.outputsForConstraint( cid );
      this.subcgraph.methodsForConstraint( cid )
            .forEach( this.subcgraph.removeMethod, this.subcgraph );
      this.freeVarQueue =
            this.freeVarQueue.concat( <string[]>outputs.filter( this.isFreeVar, this ) );

      // Remember the strongest retracted
      if (mid === null &&
          (this.strongestRetractedCid === null ||
           this.strengths.compare( this.strongestRetractedCid, cid ) < 0)) {
        this.strongestRetractedCid = cid;
      }
    }

    /*----------------------------------------------------------------
     * Simple predicate to see if a variable is free.
     */
    private isFreeVar( vid: string ): boolean {
      var cids = this.subcgraph.constraintsWhichOutput( vid );
      return cids.length == 1;
    }

    /*----------------------------------------------------------------
     * Simple predicate to see if a constraint is retractable.
     */
    private isRetractable( cid: string ): boolean {
      return this.strengths.compare( cid, this.cidToEnforce ) < 0;
    }

    /*----------------------------------------------------------------
     * Helper
     */
    private makeUndetermined( vid: string ) {
      u.stringSet.add( this.undeterminedVids, vid );
    }

    /*----------------------------------------------------------------
     * Helper
     */
    private makeDetermined( vid: string ) {
      u.stringSet.remove( this.undeterminedVids, vid );
    }

  }

  /*------------------------------------------------------------------
   * Helper function for copying constraints from one constraint
   * graph to another.
   *
   * Written in curried form to facilitate applying with forEach.
   */
  function copyConstraintsFrom( source: g.ReadOnlyConstraintGraph ) {
    return function( destination: g.ConstraintGraph, cid: string ) {
      source.variablesForConstraint( cid ).forEach( function( vid: string ) {
        if (! destination.contains( vid )) {
          destination.addVariable( vid );
        }
      } );

      source.methodsForConstraint( cid ).forEach( function( mid: string ) {
        destination.addMethod( mid,
                               cid,
                               source.inputsForMethod( mid ),
                               source.outputsForMethod( mid )
                             );
      } );
      return destination;
    }
  }

  /*==================================================================
   * The full Quick Plan algorithm.
   */
  class QuickPlan {

    // The full constraint graph we are operating over
    private cgraph: g.ReadOnlyConstraintGraph;

    // The current solution graph (modifies in-place)
    private sgraph: TransactionalSolutionGraph;

    // The current strength assignment
    private strengths: NumericStrengthAssignment;

    // Max-heap of the constraints we should attempt to add to the solution
    private cidsToEnforce: u.Heap<string>;

    /*----------------------------------------------------------------
     * Initialize
     */
    constructor( cgraph: g.ReadOnlyConstraintGraph,
                 strengths: NumericStrengthAssignment,
                 sgraph: TransactionalSolutionGraph,
                 cidsToEnforce: u.ArraySet<string>     ) {
      this.cgraph = cgraph;
      this.sgraph = sgraph;
      this.strengths = strengths;

      // Move the cids into a max-heap
      this.cidsToEnforce = new u.Heap<string>(
        function( cid1: string, cid2: string ) {
          return strengths.compare( cid1, cid2 ) > 0;
        }
      );
      this.cidsToEnforce.pushAll( cidsToEnforce );
    }

    /*----------------------------------------------------------------
     * Perform the quick-plan algorithm to enforce all specified
     * constraints (if possible)
     */
    run(): boolean {

      var allSucceeded = true;

      // Go through constraints from strongest to weakest
      while (this.cidsToEnforce.length > 0) {
        var cid = this.cidsToEnforce.pop();

        // Try to enforce a single constraint
        var plan1 =
              new QPSingle( cid,
                            this.cgraph,
                            this.strengths,
                            this.sgraph
                          );
        if (plan1.run()) {

          // Add back any constraints which may have become eligible
          var strongestRetracted = plan1.getStrongestRetractedCid();
          if (strongestRetracted) {
            var unenforced =
                  this.collectDownstreamUnenforced( cid,
                                                    strongestRetracted,
                                                    plan1.getUndeterminedVids()
                                                  );

            unenforced.forEach( function( cid: string ) {
              if (! this.cidsToEnforce.contains( cid )) {
                this.cidsToEnforce.push( cid );
              }
            }, this );
          }

        }
        else if (this.strengths.isRequired( cid )) {
          allSucceeded = false;
        }
      }

      return allSucceeded;
    }

    /*----------------------------------------------------------------
     * If we had to retract anything then we need to check for
     * constraints which may now be eligible for enforcing.  They are
     * the ones which are (1) downstream of something we retracted,
     * and (2) weaker than what we retracted
     */
    private collectDownstreamUnenforced( cid: string,
                                         strongestRetracted: string,
                                         undetermined: string[]      ) {
      // First, find all the downstream variables
      var selected = this.sgraph.selectedForConstraint( cid );
      var startingVars = u.arraySet.union(
        this.sgraph.outputsForMethod( selected ),
        undetermined
      );
      var downstreamVariables = new g.DigraphWalker( this.sgraph.graph )
            .nodesDownstreamSameType( startingVars );

      // Get constraints which write to those variables
      var cids = downstreamVariables
            .map( this.cgraph.constraintsWhichOutput, this.cgraph )
            .reduce( function( collected: u.StringSet, cids: u.ArraySet<string> ) {
              return cids.reduce( u.stringSet.build, collected );
            }, <u.StringSet>{} );

      // Return the ones which are unenforced and weaker
      return u.stringSet.members( cids )
            .filter( function( cid: string ) {
              return (this.strengths.compare( cid, strongestRetracted ) < 0 &&
                      this.sgraph.selectedForConstraint( cid ) === null  );
            }, this );
    }

  }

  // For type checking
  if (false) {
    var p: Planner = new QuickPlanner( null );
  }

}
