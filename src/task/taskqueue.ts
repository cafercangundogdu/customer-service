import { Task } from "./task";

export class TaskQueue {
  /**
   *  sorted Task array
   */
  private taskQueue: Task[];

  /**
   * State of first message sent ms
   */
  private baseTimeMs: number;

  /**
   * Dequeue tasks early with tolerance time
   */
  private toleranceMs: number;

  constructor() {
    this.taskQueue = [];
    this.baseTimeMs = Date.now();
    /**
     * Access tolerans from environment
     */
    this.toleranceMs = process.env.TOLERANCE_TIME_MS
      ? parseInt(process.env.TOLERANCE_TIME_MS)
      : 0;
  }

  /**
   * Pick up top task if task-time is hit.
   */
  dequeue(): Task | undefined {
    /**
     * If task queue is empty, return undefined.
     */
    if (this.taskQueue.length === 0) {
      return;
    }

    /**
     * Check whether the task time has come, with a certain tolerance time.
     */
    if (
      Date.now() >=
      this.getTaskAbsoluteTimeMs(this.taskQueue[0]) - this.toleranceMs
    ) {
      /**
       * Like a queue, Fetch and remove the first element.
       */
      return this.taskQueue.shift();
    }
  }

  /**
   * Adds tasks to the queue in order and returns its index.
   * if the task is already added, return its index.
   */
  queue(task: Task): number {
    /**
     * When the task queue is empty, task added directly to the queue.
     */
    if (this.taskQueue.length === 0) {
      this.taskQueue.push(task);
      return 0;
    }

    /**
     * check if the task is already added
     */
    const queuedTask = this.taskQueue.findIndex((q) => q.isSameTask(task));
    if (queuedTask < 0) {
      /**
       * To keep the array sorted, we place the element in the correct order when added.
       */
      return this.insertSorted(task);
    }

    /**
     * task is already added, return index
     */
    return queuedTask;
  }

  /**
   * Removes tasks belonging to the same group.
   * Returns removed task count
   */
  removeTasks(task: Task) {
    const filtered = this.taskQueue.filter((e) => !e.inSameGroup(task));
    const removedLen = this.taskQueue.length - filtered.length;
    this.taskQueue = filtered;

    return removedLen;
  }

  /**
   * Returns queue size
   */
  queueSize(): number {
    return this.taskQueue.length;
  }

  /**
   * Returns a copy of task queue.
   */
  getQueueList(): Task[] {
    return this.taskQueue.slice();
  }

  /**
   * Returns queue base time milisecond
   */
  getTimeMs(): number {
    return this.baseTimeMs;
  }

  /**
   * Returns tolerance time milisecond
   */
  getToleranceMs(): number {
    return this.toleranceMs;
  }

  /**
   * Sets the tasks base time for checking tasks relative time.
   */
  setTimeMs(dateTimeMs: number): void {
    // console.log("changed base time: old | new", this._timeMs, ms);
    this.baseTimeMs = dateTimeMs;
  }

  /**
   * Calculates and returns the task absolute time milisecond with base time and task relative time
   * @see `baseTimeMs`
   * @see `Task.relativeTime`
   */
  getTaskAbsoluteTimeMs(task: Task): number {
    // console.log("calculated task time: relative: ", task.getRelativeTime());
    return this.baseTimeMs + task.getRelativeTime() * 1000;
  }

  /**
   * Insertion Sort Algorithm
   * time complexity : o(n^2)
   * Inserts the task to task queue in right order.
   * @param task
   * @returns task inserted index
   */
  private insertSorted(task: Task): number {
    let i = 0;
    for (
      i = this.taskQueue.length - 1;
      i >= 0 && this.taskQueue[i].getRelativeTime() > task.getRelativeTime();
      i--
    ) {
      this.taskQueue[i + 1] = this.taskQueue[i];
    }
    this.taskQueue[i + 1] = task;
    return i + 1;
  }
}
