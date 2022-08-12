import { PaymentResponse, HttpAPI } from "../http";
import { Task } from "../task/task";
import {
  Worker,
  WorkerInputMessageType,
  WorkerOutputMessageType,
} from "./worker";

export type TaskSendWorkerOutputMessageType = WorkerOutputMessageType & {
  type: "task_remove" | "time_ms";
  data: Task | number;
};

export type TaskSendWorkerInputMessageType = WorkerInputMessageType & {
  task: Task;
  absoluteTimeMs: number;
};

export class TaskSendWorker extends Worker<
  TaskSendWorkerInputMessageType,
  TaskSendWorkerOutputMessageType
> {
  private httpApi: HttpAPI;
  constructor(httpApi: HttpAPI) {
    super();
    this.httpApi = httpApi;
  }
  run(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.on("stop", () => {
          resolve();
        });

        let firstSendTimeMs: number;
        this.on("input", (message: TaskSendWorkerInputMessageType) => {
          this.sendTask(
            message.task,
            message.absoluteTimeMs,
            this.httpApi,
            () => {
              // TODO: remove debug
              if (firstSendTimeMs) {
                console.log(Date.now() - firstSendTimeMs);
              }
              if (!firstSendTimeMs) {
                firstSendTimeMs = Date.now();
                this.emit("output", {
                  type: "time_ms",
                  data: firstSendTimeMs,
                });
              }
            }
          ).then((response: PaymentResponse) => {
            if (response.paid === true) {
              this.emit("output", {
                type: "task_remove",
                data: message.task,
              });
            }
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async sendTask(
    task: Task,
    runOnTimeMs: number,
    httpApi: HttpAPI,
    onSend: () => void
  ): Promise<PaymentResponse> {
    const tolerans = process.env.FIRE_TOLERANS_TIME_MS
      ? parseInt(process.env.FIRE_TOLERANS_TIME_MS)
      : 0;
    return new Promise((resolve) => {
      const delayMs = runOnTimeMs - Date.now() - tolerans;
      console.log("delay ms: ", delayMs);
      setTimeout(
        () => {
          resolve(
            httpApi.checkPayment(
              {
                email: task.getCustomer().email,
                text: task.getCustomer().text,
              },
              onSend
            )
          );
        },
        delayMs < 5 ? 0 : delayMs // TODO: check if small 10ms
      );
    });
  }
}
