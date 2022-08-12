import { Task } from "../task/task";
import { TaskQueue } from "../task/taskqueue";
import {
  Worker,
  WorkerInputMessageType,
  WorkerOutputMessageType,
} from "./worker";

/**
 * TaskQueue Worker output message type
 */
export interface TaskQueueWorkerOutputMessageType
  extends WorkerOutputMessageType {
  task: Task;
  absoluteTimeMs: number;
}

export enum TaskType {
  Task = "task",
  TaskRemove = "task_remove",
  TimeMs = "time_ms",
}

export interface TaskQueueWorkerInputMessageTaskType
  extends WorkerInputMessageType {
  type: TaskType.Task;
  data: Task;
}

export interface TaskQueueWorkerInputMessageTaskRemoveType
  extends WorkerInputMessageType {
  type: TaskType.TaskRemove;
  data: Task;
}

export interface TaskQueueWorkerInputMessageTimeMsType
  extends WorkerInputMessageType {
  type: TaskType.TimeMs;
  data: number;
}

/**
 * TaskQueue Worker input message type
 */
export type TaskQueueWorkerInputMessageType =
  | TaskQueueWorkerInputMessageTaskType
  | TaskQueueWorkerInputMessageTaskRemoveType
  | TaskQueueWorkerInputMessageTimeMsType;

/**
 * TaskQueue Worker
 * Receiving a `Task` object with input event,
 * puts the given task to task queue,
 * emits `output` event with `Task` object when task-timing hit on a Task
 */
export class TaskQueueWorker extends Worker<
  TaskQueueWorkerInputMessageType,
  TaskQueueWorkerOutputMessageType
> {
  /**
   * Queue for Tasks
   */
  private taskQueue: TaskQueue;
  constructor() {
    super();
    this.taskQueue = new TaskQueue();
  }

  run(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const intervalTime = process.env.INTERVAL_TIME_MS
          ? parseInt(process.env.INTERVAL_TIME_MS)
          : 10;
        setInterval(() => {
          if (this.taskQueue.queueSize() > 0) {
            const task = this.taskQueue.dequeue();
            if (task) {
              this.emit("output", {
                task,
                absoluteTimeMs: this.taskQueue.getTaskAbsoluteTimeMs(task),
              });
            }
          }
        }, intervalTime);

        this.on("input", (message: TaskQueueWorkerInputMessageType) => {
          switch (message.type) {
            case TaskType.Task:
              this.taskQueue.queue(message.data);
              break;
            case TaskType.TimeMs:
              this.taskQueue.setTimeMs(message.data);
              break;
            case TaskType.TaskRemove:
              this.taskQueue.removeTasks(message.data);
              break;
            default:
              break;
          }
        });

        this.on("stop", () => {
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  getTaskQueue(): TaskQueue {
    return this.taskQueue;
  }
}
