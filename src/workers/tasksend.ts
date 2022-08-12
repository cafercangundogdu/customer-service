import { PaymentResponse, HttpAPI } from "../http";
import { Task } from "../task/task";
import {
  Worker,
  WorkerInputMessageType,
  WorkerOutputMessageType,
} from "./worker";

/**
 * TaskSend Worker output message type
 */
export type TaskSendWorkerOutputMessageType = WorkerOutputMessageType & {
  type: "task_remove" | "time_ms";
  data: Task | number;
};

/**
 * TaskSend Worker input message type
 */
export type TaskSendWorkerInputMessageType = WorkerInputMessageType & {
  task: Task;
  absoluteTimeMs: number;
};

/**
 * TaskSend Worker
 * Receiving a `Task` object with input event,
 * sends http request to target endpoint,
 * processing the response then emits `output` event with params.
 */
export class TaskSendWorker extends Worker<
  TaskSendWorkerInputMessageType,
  TaskSendWorkerOutputMessageType
> {
  /**
   * Handler for http
   */
  private httpApi: HttpAPI;

  /**
   * Tasks are brought before their task times.
   * We determine this with the tolerance time.
   */
  private toleranceTime: number;
  constructor(httpApi: HttpAPI) {
    super();
    this.httpApi = httpApi;

    /**
     * Get tolerans time from environment
     */
    this.toleranceTime = process.env.FIRE_TOLERANS_TIME_MS
      ? parseInt(process.env.FIRE_TOLERANS_TIME_MS)
      : 0;
  }

  run(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        /**
         * Listens stop event
         */
        this.on("stop", () => {
          resolve();
        });

        /**
         * State for first task sent time
         */
        let firstSendTimeMs: number;
        this.on("input", (message: TaskSendWorkerInputMessageType) => {
          this.sendTask(
            message.task,
            message.absoluteTimeMs,
            this.httpApi,
            () => {
              // TODO: remove debug
              /*
              if (firstSendTimeMs) {
                console.log(Date.now() - firstSendTimeMs);
              }
              */
              if (!firstSendTimeMs) {
                /**
                 * if its first task, set sent time
                 */
                firstSendTimeMs = Date.now();

                /**
                 * emit output event for handle first task proceed time.
                 */
                this.emit("output", {
                  type: "time_ms",
                  data: firstSendTimeMs,
                });
              }
            }
          ).then((response: PaymentResponse) => {
            if (response.paid === true) {
              /**
               * customer task is done, so we broadcast the event to remove other same groupped tasks
               */
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

  /**
   * Sends http request with given HttpApi instance.
   * @param task
   * @param runOnTimeMs is exact time for send request
   * @param httpApi HttpApi instance
   * @param onSend called when request on send
   * @returns
   */
  async sendTask(
    task: Task,
    runOnTimeMs: number,
    httpApi: HttpAPI,
    onSend: () => void
  ): Promise<PaymentResponse> {
    return new Promise((resolve) => {
      /**
       * Calculate delay time
       */
      const delayMs = runOnTimeMs - Date.now() - this.toleranceTime;
      // console.log("delay ms: ", delayMs);
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
        /**
         * When we want to wait under 5ms,
         * settimeout delays in execution (sometimes extra 5-6ms)
         */
        delayMs < 5 ? 0 : delayMs
      );
    });
  }
}
