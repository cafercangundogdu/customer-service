import "dotenv-defaults/config";
import { Customer } from "../customer";
import { Task } from "../task/task";
import {
  TaskQueueWorker,
  TaskQueueWorkerOutputMessageType,
  TaskType,
} from "./taskqueue";

describe("Test Task Queue Worker", () => {
  it("should INTERVAL_TIME_MS set", () => {
    expect(process.env.INTERVAL_TIME_MS).not.toBe(undefined);
  });

  it("should TOLERANCE_TIME_MS set", () => {
    expect(process.env.TOLERANCE_TIME_MS).not.toBe(undefined);
  });

  const toleranceTime = parseInt(process.env.TOLERANCE_TIME_MS as string);

  const taskTimeoutMs = 5000;
  it(
    "should correctly output timed tasks",
    async () => {
      const taskQueueWorker = new TaskQueueWorker();
      const customer = new Customer(
        "vdaybell0@seattletimes.com",
        "Hi Vincenty, your invoice about $1.99 is due.",
        "0s-2s-4s"
      );

      const tasks = Task.fromCustomers(customer);

      const workerPromise = taskQueueWorker.run();

      for (const task of tasks) {
        taskQueueWorker.send({
          type: TaskType.Task,
          data: task,
        });
      }

      let proceedTaskCount = 0;
      taskQueueWorker.on(
        "output",
        ({ task, absoluteTimeMs }: TaskQueueWorkerOutputMessageType) => {
          proceedTaskCount++;
          expect(absoluteTimeMs - toleranceTime).toBeLessThanOrEqual(
            Date.now()
          );
          expect(
            task.isSameTask(
              new Task(customer, customer.schedule[proceedTaskCount - 1])
            )
          ).toBe(true);
        }
      );

      setTimeout(() => {
        taskQueueWorker.emit("stop");
      }, taskTimeoutMs);

      await workerPromise;
    },
    taskTimeoutMs + 1000
  );

  it(
    "should correctly remove tasks",
    async () => {
      const taskQueueWorker = new TaskQueueWorker();
      const customer = new Customer(
        "vdaybell0@seattletimes.com",
        "Hi Vincenty, your invoice about $1.99 is due.",
        "0s-2s-4s"
      );

      const tasks = Task.fromCustomers(customer);

      const workerPromise = taskQueueWorker.run();

      setTimeout(() => {
        taskQueueWorker.emit("stop");
      }, taskTimeoutMs);

      for (const task of tasks) {
        taskQueueWorker.send({
          type: TaskType.Task,
          data: task,
        });
      }

      taskQueueWorker.send({
        type: TaskType.TaskRemove,
        data: tasks[0],
      });

      expect(taskQueueWorker.getTaskQueue().queueSize()).toBe(0);

      await workerPromise;
    },
    taskTimeoutMs + 1000
  );

  it(
    "should correctly set base time",
    async () => {
      const taskQueueWorker = new TaskQueueWorker();
      const customer = new Customer(
        "vdaybell0@seattletimes.com",
        "Hi Vincenty, your invoice about $1.99 is due.",
        "0s-2s-4s"
      );

      const tasks = Task.fromCustomers(customer);

      const workerPromise = taskQueueWorker.run();

      setTimeout(() => {
        taskQueueWorker.emit("stop");
      }, taskTimeoutMs);

      for (const task of tasks) {
        taskQueueWorker.send({
          type: TaskType.Task,
          data: task,
        });
      }

      const expectDateMs = Date.now();

      taskQueueWorker.send({
        type: TaskType.TimeMs,
        data: expectDateMs,
      });

      expect(taskQueueWorker.getTaskQueue().getTimeMs()).toBe(expectDateMs);

      await workerPromise;
    },
    taskTimeoutMs + 1000
  );
});
