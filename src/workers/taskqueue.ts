import { Task } from "../task/task";
import { TaskQueue } from "../task/taskqueue";
import {
  Worker,
  WorkerInputMessageType,
  WorkerOutputMessageType,
} from "./worker";

export type TaskQueueWorkerOutputMessageType = WorkerOutputMessageType & {
  task: Task;
  absoluteTimeMs: number;
};

export type TaskQueueWorkerInputMessageType = WorkerInputMessageType & {
  type: "task" | "task_remove" | "time_ms";
  data: Task | number;
};

export class TaskQueueWorker extends Worker<
  TaskQueueWorkerInputMessageType,
  TaskQueueWorkerOutputMessageType
> {
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
            case "task":
              this.taskQueue.queue(message.data as Task);
              break;
            case "time_ms":
              this.taskQueue.setTimeMs(message.data as number);
              break;
            case "task_remove":
              this.taskQueue.removeTasks(message.data as Task);
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
