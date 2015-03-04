/*####################################################################
 * Exports the "schedule" function, which schedules a function to be
 * executed at the next available time after the current line of
 * execution has finished -- effectively window.setTimeout( fn, 0 )
 * or the non-standard window.setImmediate( fn ).
 *
 * Two ways this is different from setTimeout( fn, 0 ):
 * 1. Guarantees that, if schedule( f ) is called before schedule( g )
 *    then f will be called before g.
 * 2. Supports associating a priority with a function (0 = highest
 *    priority; increasing number = decreasing priority); will always
 *    run higher priority function first regardless of when it was
 *    scheduled.
 */
module hd.utility {

  /*==================================================================
   * Remembers everything needed to perform a single requested
   * execution.
   */
  export
  class ScheduledTask {
    priority: number;
    fn: Function;
    thisArg: Object;
    params: any[];

    constructor( priority: number,
                 fn: Function,
                 thisArg: Object,
                 params: any[]
               ) {
      this.priority = priority;
      this.fn = fn;
      this.thisArg = thisArg;
      this.params = params;
    }

    run() {
      try {
        this.fn.apply( this.thisArg, this.params );
      }
      catch (e) {
        console.error( e );
      }
    }
  }

  /*==================================================================
   * Invoke the next scheduled task
   */

  // queues, indexed by their priority
  var taskqueues: Queue<ScheduledTask>[] = [];

  // total number of tasks queued up
  var taskcount = 0;

  // id of the current timeout
  var timerId: number = null;

  function runTasks(): void {
    do {
    var task: ScheduledTask = null;

    // get the next task from the first non-empty queue
    for (var i = 0; task === null && i < taskqueues.length; ++i) {
      var queue = taskqueues[i];
      if (queue && queue.isNotEmpty()) {
        task = queue.dequeue();
      }
    }

    // run the task
    if (task) {
      task.run();
      --taskcount;
    }
    else {
      taskcount = 0;
    }

    } while (taskcount > 0);

    if (taskcount) {
      timerId = setTimeout( runTasks, 0 );
    }
    else {
      timerId = null;
    }
  }

  /*==================================================================
   * Schedule a function to be run later.
   */
  export function schedule( priority: number,
                            fn: Function,
                            thisArg?: Object,
                            ...params: any[]  ): ScheduledTask {

    if (priority < 0) {
      try {
        fn.apply( thisArg, params );
      }
      catch (e) {
        console.error( e );
      }

      return null;
    }
    else {
      var task = new ScheduledTask( priority, fn, thisArg, params );

      // add the task to the approriate queue
      var queue = taskqueues[priority];
      if (queue === undefined) {
        queue = taskqueues[priority] = new Queue<ScheduledTask>();
      }
      queue.enqueue( task );
      ++taskcount;

      // set timer to run all scheduled tasks
      if (! timerId) {
        timerId = setTimeout( runTasks, 0 );
      }

      return task
    }
  }

  export function deschedule( task: ScheduledTask ) {
    var queue = taskqueues[task.priority];
    if (queue) {
      queue.remove( task );
    }
  }
}