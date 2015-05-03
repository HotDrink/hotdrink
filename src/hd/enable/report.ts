/*####################################################################
 * The UsageReporter class.
 */
module hd.enable {

  import u = hd.utility;
  import r = hd.reactive;
  import g = hd.graph;

  /*==================================================================
   * Updates enablement graph labels to reflect whether inputs were
   * used in a specific method invocation.
   *
   * Uses "Assumed" labels until all output promises have been
   * resolved; then switches to regular labels.
   *
   * Does not keep pointers to any promises; simply subscribes to
   * them.  Thus, when promises are reclaimed, these will be too.
   */
  export class EnableReporter {

    // The enablement graph
    egraph: EnablementLabels;

    // The id of the method we're watching
    mid: string;

    // The input vids for this method
    inputVids: string[];

    // How many outputs for this method
    outputCount: number;

    // How many output promises have completed
    completedCount = 0;

    /*----------------------------------------------------------------
     * Initialize and subscribe
     */
    constructor( egraph:  EnablementLabels,
                 mid:     string,
                 inputs:  u.Dictionary<r.Promise<any>>,
                 outputs: u.Dictionary<r.Promise<any>>  ) {
      this.egraph = egraph;
      this.mid = mid;
      this.inputVids = Object.keys( inputs );
      this.outputCount = 0;

      // Watch dependency counts of all inputs
      for (var vid in inputs) {
        inputs[vid].usage.addObserver( this, this.onNextUsage, null, null, vid );
      }

      // Watch all outputs
      for (var vid in outputs) {
        outputs[vid].addObserver( this, null, null, this.onCompletedOutput );
        ++this.outputCount;
      }
    }

    /*----------------------------------------------------------------
     * When an output promise completes
     */
    onCompletedOutput() {
      if (++this.completedCount == this.outputCount && this.egraph) {
        for (var i = 0, l = this.inputVids.length; i < l; ++i) {
          var vid = this.inputVids[i];
          if (this.egraph.getLabel( vid, this.mid ) === Label.AssumedRelevant) {
            this.egraph.setLabel( vid, this.mid, Label.Irrelevant );
          }
        }
      }
    }

    /*----------------------------------------------------------------
     * When input usage changes
     */
    onNextUsage( usage: r.Usage, vid: string ) {
      if (this.egraph) {
        if (usage === r.Usage.Used) {
          this.egraph.setLabel( vid, this.mid, Label.Relevant );
        }
        else if (usage === r.Usage.Unused) {
          this.egraph.setLabel( vid, this.mid, Label.Irrelevant );
        }
        else if (this.completedCount < this.outputCount) {
          this.egraph.setLabel( vid, this.mid, Label.AssumedRelevant );
        }
      }
    }

    /*----------------------------------------------------------------
     * Stop reporting results to enablement graph
     */
    cancel() {
      this.egraph = null;
    }
  }

  /*==================================================================
   * Enablement manager is used to keep track of all the
   * EnableReporters and make sure that they get canceled when their
   * results are overwritten.  Also manages changes to egraph.
   */
  export class EnablementManager {

    // The enablement graph
    egraph: EnablementLabels = new EnablementLabels();

    // The reporters
    reporters: u.Dictionary<EnableReporter> = {};

    /*----------------------------------------------------------------
     * Used to indicate a new method has been scheduled.  Updates
     * the enablement graph, creates new reporters, cancels old ones.
     */
    methodScheduled( cid: string,
                     mid: string,
                     inputs?: u.Dictionary<r.Promise<any>>,
                     outputs?: u.Dictionary<r.Promise<any>> ) {
      this.egraph.selectMethod( cid, mid );
      if (this.reporters[cid]) {
        this.reporters[cid].cancel();
        if (! mid) {
          delete this.reporters[cid];
        }
      }
      if (mid) {
        this.reporters[cid] =
              new EnableReporter( this.egraph,
                                  mid,
                                  inputs,
                                  outputs
                                );
      }
    }
  }

}