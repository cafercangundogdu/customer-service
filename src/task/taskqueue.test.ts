import { Customer } from "../customer";
import { Task } from "./task";
import { TaskQueue } from "./taskqueue";

describe("Test TaskQueue queue functionality", () => {
  const taskQueue = new TaskQueue();

  const customer1: Customer = new Customer(
    "vdaybell0@seattletimes.com",
    "Hi Vincenty, your invoice about $1.99 is due.",
    "0s-2s-4s"
  );

  const customer2: Customer = new Customer(
    "esealove2@go.com",
    "Hola Elspeth, aun tienes un pago de $4.55 pendiente.",
    "1s-5s-8s"
  );

  const tasks = Task.fromCustomers(customer1, customer2);

  for (const task of tasks) {
    taskQueue.queue(task);
  }

  it("should same task size", () => {
    expect(taskQueue.queueSize()).toBe(tasks.length);
  });

  const taskQueueList = taskQueue.getQueueList();

  const rightOrderedQueueList = [
    new Task(customer1, 0),
    new Task(customer2, 1),
    new Task(customer1, 2),
    new Task(customer1, 4),
    new Task(customer2, 5),
    new Task(customer2, 8),
  ];

  it("should Taskqueue queued right index", () => {
    for (let i = 0; i < rightOrderedQueueList.length; i++) {
      expect(taskQueue.queue(rightOrderedQueueList[i])).toBe(i);
    }
  });

  it("should TaskQueue queued right order", () => {
    for (let i = 0; i < taskQueueList.length; i++) {
      expect(taskQueueList[i].isSameTask(rightOrderedQueueList[i])).toBe(true);
    }
  });

  it("should be right absolute time for queued tasks", () => {
    for (let i = 0; i < taskQueueList.length; i++) {
      expect(taskQueue.getTaskAbsoluteTimeMs(taskQueueList[i])).toBe(
        taskQueue.getTimeMs() + taskQueueList[i].getRelativeTime() * 1000
      );
    }
  });

  it("should right tolerance time", () => {
    expect(taskQueue.getToleranceMs()).toBeGreaterThanOrEqual(0);
  });
});

describe("Test TaskQueue dequeue functionality", () => {
  const taskQueue = new TaskQueue();

  const customer1: Customer = new Customer(
    "vdaybell0@seattletimes.com",
    "Hi Vincenty, your invoice about $1.99 is due.",
    "0s-2s-4s"
  );

  const customer2: Customer = new Customer(
    "esealove2@go.com",
    "Hola Elspeth, aun tienes un pago de $4.55 pendiente.",
    "1s-5s-8s"
  );

  const tasks = Task.fromCustomers(customer1, customer2);

  for (const task of tasks) {
    taskQueue.queue(task);
  }

  const rightOrderedQueueList = [
    new Task(customer1, 0),
    new Task(customer2, 1),
    new Task(customer1, 2),
    new Task(customer1, 4),
    new Task(customer2, 5),
    new Task(customer2, 8),
  ];

  const taskBaseMs = Date.now();
  taskQueue.setTimeMs(taskBaseMs);

  const queueTaskList = taskQueue.getQueueList();
  const lastTask = queueTaskList[queueTaskList.length - 1];

  it(
    "should be correctly dequeue",
    async () => {
      const sleep = async (sleepTime: number) => {
        return new Promise((resolve, reject) => {
          setTimeout(resolve, sleepTime);
        });
      };
      let i = 0;
      while (taskQueue.queueSize() > 0) {
        const task = taskQueue.dequeue();
        if (task) {
          const rightTask = rightOrderedQueueList[i];
          expect(rightTask.isSameTask(task)).toBe(true);
          i++;
        }
        await sleep(500);
      }

      if (taskQueue.queueSize() === 0) {
        expect(taskQueue.dequeue()).toBe(undefined);
      }
    },
    (lastTask.getRelativeTime() + 1) * 1000 // relative timeout
  );
});

describe("Test TaskQueue removeTasks functionality", () => {
  const taskQueue = new TaskQueue();

  const customer1: Customer = new Customer(
    "vdaybell0@seattletimes.com",
    "Hi Vincenty, your invoice about $1.99 is due.",
    "0s-2s-4s"
  );

  const customer2: Customer = new Customer(
    "esealove2@go.com",
    "Hola Elspeth, aun tienes un pago de $4.55 pendiente.",
    "1s-5s-8s"
  );

  const customer1Tasks = Task.fromCustomers(customer1);
  const customer2Tasks = Task.fromCustomers(customer2);

  const allTasks = [...customer1Tasks, ...customer2Tasks];
  for (const task of allTasks) {
    taskQueue.queue(task);
  }

  it("should correctly remove tasks by group", () => {
    const toBeRemoveTaskGroup = customer1Tasks[0];

    console.log(taskQueue.getQueueList());

    const queueSize = taskQueue.queueSize();
    const removedTaskCount = taskQueue.removeTasks(toBeRemoveTaskGroup);

    console.log(taskQueue.getQueueList());

    expect(taskQueue.queueSize()).toBe(queueSize - removedTaskCount);

    expect(removedTaskCount).toBe(customer1Tasks.length);

    const remainTasks = taskQueue.getQueueList();
    const hasCustomer1Tasks = remainTasks.find((task) =>
      task.inSameGroup(toBeRemoveTaskGroup)
    );

    expect(hasCustomer1Tasks).toBe(undefined);
  });
});
