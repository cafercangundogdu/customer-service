import { Customer } from "../customer";
import { HttpAPI } from "../http";
import { Task } from "../task/task";
import { CsvWorker, CsvWorkerOutputMessageType } from "./csv";
import {
  TaskQueueWorker,
  TaskQueueWorkerOutputMessageType,
  TaskType,
} from "./taskqueue";
import { TaskSendWorker, TaskSendWorkerOutputMessageType } from "./tasksend";
import { Worker, WorkerType } from "./worker";

export class PrimaryWorker extends Worker {
  workers: {
    // [key in Exclude<Partial<WorkerType>, WorkerType.PRIMARY>]: Worker;
    [WorkerType.CSV]: CsvWorker;
    [WorkerType.TASK_QUEUE]: TaskQueueWorker;
    [WorkerType.TASK_SEND]: TaskSendWorker;
  };
  constructor() {
    super();

    this.workers = {
      [WorkerType.CSV]: new CsvWorker(),
      [WorkerType.TASK_QUEUE]: new TaskQueueWorker(),
      [WorkerType.TASK_SEND]: new TaskSendWorker(new HttpAPI()),
    };
  }

  run(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.on("stop", () => {
          resolve();
        });

        this.workers[WorkerType.CSV].on(
          "output",
          (message: CsvWorkerOutputMessageType) => {
            // console.log("row: ", message.row);
            const customer: Customer = Customer.createCustomerFromRow(
              message.row
            );
            customer.schedule.forEach((relativeTime) =>
              this.workers[WorkerType.TASK_QUEUE].send({
                type: TaskType.Task,
                data: new Task(customer, relativeTime),
              })
            );
          }
        );

        this.workers[WorkerType.TASK_QUEUE].on(
          "output",
          (message: TaskQueueWorkerOutputMessageType) => {
            this.workers[WorkerType.TASK_SEND].send(message);
          }
        );

        this.workers[WorkerType.TASK_SEND].on(
          "output",
          (message: TaskSendWorkerOutputMessageType) => {
            if (
              message.type === TaskType.TaskRemove ||
              message.type === TaskType.TimeMs
            ) {
              this.workers[WorkerType.TASK_QUEUE].send(message);
            }
          }
        );

        for (const worker of Object.values(this.workers)) {
          worker.run();
        }
      } catch (e) {
        reject(e);
      }
    });
  }
}
