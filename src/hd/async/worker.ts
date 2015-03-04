
module hd.async {

  import u = hd.utility;
  import r = hd.reactive;

  /*==================================================================
   * Record type for a single scheduled task.
   */
  interface WorkerTask {

    // Name of the function the worker should call
    fnName: string;

    // The input parameters
    inputs: any[];

    // The promises to fulfill with the return value
    outputs: r.Promise<any>[];

    // The worker assigned to the task
    worker?: Worker;
  }

  /*==================================================================
   * Represents a pool of workers.  Tasks are assigned to a worker
   * as they become available.
   */
  export
  class WorkerPool {

    // Maximum number of workers to create
    max: number;

    // The url string to use when creating new workers
    private sourceUrl: string;

    // List of workers not currently doing anything
    private availableWorkers: Worker[] = [];

    // List of tasks currently being run by a worker
    private runningTasks: WorkerTask[] = [];

    // List of tasks waiting to be run by a worker
    private queuedTasks: WorkerTask[] = [];

    /*----------------------------------------------------------------
     * Initialize.
     */
    constructor( sourceUrl: string, max = 20 ) {
      this.sourceUrl = sourceUrl;
      this.max = max;
    }

    /*----------------------------------------------------------------
     * Schedule a function to be run on the next available worker.
     */
    schedule( fnName: string, inputs: any[], numOutputs = 1 ): r.Promise<any>[] {
      // Create output promises
      var outputs: r.Promise<any>[] = [];
      for (var i = 0; i < numOutputs; ++i) {
        outputs.push( new r.Promise<any>() );
      }

      // Create task
      var task = {fnName: fnName, inputs: inputs, outputs: outputs};

      // Subscribe to dropped outputs
      outputs.forEach( function( p: r.Promise<any> ) {
        p.ondropped.addObserver( this, this.onPromiseDropped, null, null, task );
      }, this );

      // Queue task, then try to run
      this.queuedTasks.push( task );
      this.checkQueue();

      return outputs;
    }

    /*----------------------------------------------------------------
     * Check to see if any queued tasks can be executed.
     */
    private
    checkQueue() {
      // Try using available workers
      while (this.queuedTasks.length > 0 && this.availableWorkers.length > 0) {
        this.execute( this.queuedTasks.shift(), this.availableWorkers.shift() );
      }

      // Try using new workers
      while (this.queuedTasks.length > 0 && this.runningTasks.length < this.max) {
        var task = this.queuedTasks.shift()
        try {
          this.execute( task, new Worker( this.sourceUrl ) );
        }
        catch (e) {
          console.error( 'Unable to create worker', e );
          task.outputs.forEach( function( p: r.Promise<any> ) {
            p.reject( 'Script unable to create worker' );
          } );
        }
      }
    }

    /*----------------------------------------------------------------
     * Execute a task on a worker.
     */
    private
    execute( task: WorkerTask, worker: Worker ) {
      task.worker = worker;
      this.runningTasks.push( task );

      worker.onmessage = this.onMessage.bind( this, task );
      worker.onerror = this.onError.bind( this, task );
      worker.postMessage( {
        fnName: task.fnName,
        inputs: task.inputs
      } );
    }

    /*----------------------------------------------------------------
     * Process normal messages from worker.
     */
    private
    onMessage( task: WorkerTask, event: any ) {
      if (event.data.error) {
        // Failure - function failed but worker is still OK
        console.warn( 'Task failed: ' + JSON.stringify( event.data.error ) );
        task.outputs.forEach( function( p ) {
          p.reject( event.data.error );
        } );
        this.returnWorker( task.worker );
      }
      else if (event.data.complete) {
        // Completion
        var result = event.data.result;
        if (task.outputs.length == 1) {
          task.outputs[0].resolve( result );
        }
        else {
          for (var i = 0, l = task.outputs.length; i < l; ++i) {
            task.outputs[i].resolve( result[i] );
          }
        }
        this.returnWorker( task.worker );
      }
      else {
        // Partial update
        var result = event.data.result;
        if (task.outputs.length == 1) {
          task.outputs[0].notify( result );
        }
        else {
          for (var i = 0, l = task.outputs.length; i < l; ++i) {
            task.outputs[i].notify( result[i] );
          }
        }
      }
    }

    /*----------------------------------------------------------------
     * Process error from worker.  Shouldn't happen -- assume
     * something is wrong with the worker.
     */
    private
    onError( task: WorkerTask, event: any ) {
      console.warn( 'Worker failed: ' + JSON.stringify( event.data ) );
      task.outputs.forEach( function( p ) {
        p.reject( event.data );
      } );
      this.killWorker( task.worker );
    }

    /*----------------------------------------------------------------
     * Return worker after task is completed.  Checks to see if there
     * are any tasks waiting on a worker; if not, it is returned to
     * the available state.
     */
    private
    returnWorker( worker: Worker ) {
      if (this.runningTasks.length >= this.max) {
        this.killWorker( worker );
      }
      else if (this.queuedTasks.length > 0) {
        this.execute( this.queuedTasks.shift(), worker );
      }
      else {
        var i = this.findTaskIndexFor( worker );
        if (i >= 0) {
          this.runningTasks.splice( i, 1 );
          worker.onmessage = null;
          worker.onerror = null;
          this.availableWorkers.push( worker );
        }
      }
    }

    /*----------------------------------------------------------------
     * Terminates worker process; discards worker.
     */
    private
    killWorker( worker: Worker ) {
      var i = this.findTaskIndexFor( worker );
      if (i >= 0) {
        this.runningTasks.splice( i, 1 );
      }
      worker.terminate();
      this.checkQueue();
    }

    /*----------------------------------------------------------------
     * Called when an output promise is dropped.  If all outputs are
     * dropped then it kills the worker.
     */
    private
    onPromiseDropped( promise: r.Promise<any>, task: WorkerTask ) {
      if (task.outputs.every( isDropped )) {
        if (task.worker) {
          this.killWorker( task.worker );
        }
        else {
          this.dequeue( task );
        }
      }
    }

    /*----------------------------------------------------------------
     * Remove task from queue -- it's output is no longer needed.
     */
    private
    dequeue( task: WorkerTask ) {
      var i = this.queuedTasks.indexOf( task );
      if (i >= 0) {
        this.queuedTasks.splice( i, 1 );
      }
    }

    /*----------------------------------------------------------------
     * Find the task for given worker.
     */
    private
    findTaskIndexFor( worker: Worker ) {
      for (var i = 0, l = this.runningTasks.length; i < l; ++i) {
        if (this.runningTasks[i].worker === worker) {
          return i;
        }
      }
      return -1;
    }

  }

  function isDropped( p: r.Promise<any> ) {
    return ! p.hasDependencies();
  }

  /*==================================================================
   */

  export
  var workerPools: u.Dictionary<WorkerPool> = {};

  export
  function setMaxWorkers( sourceUrl: string, max: number ) {
    var pool = workerPools[sourceUrl];
    if (pool) {
      pool.max = max;
    }
    else {
      workerPools[sourceUrl] = new WorkerPool( sourceUrl, max );
    }
  }

  export
  function worker( sourceUrl: string,
                   fnName: string,
                   numOutputs: number = 1 ) {
    if (! workerPools[sourceUrl]) {
      workerPools[sourceUrl] = new WorkerPool( sourceUrl );
    }
    return function(): any {
      var pool = workerPools[sourceUrl];
      var outputs =
            pool.schedule( fnName,
                           Array.prototype.slice.call( arguments, 0, arguments.length ),
                           numOutputs
                         );
      if (numOutputs == 1) {
        return outputs[0];
      }
      else {
        return outputs;
      }
    }
  }

}

module hd {
  export var setMaxWorkers = async.setMaxWorkers;
  export var worker = async.worker;
}
