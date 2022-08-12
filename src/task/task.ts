import { Customer } from "../customer";
/**
 * Class for processing task
 */
export class Task {
  /**
   * Unique task id
   */
  private id: string;

  /**
   * Task group id.
   */
  private groupId: string;

  private customer: Customer;

  /**
   * Task relative time. Specifies how long after the first task processed.
   */
  private relativeTime: number;

  constructor(customer: Customer, relativeTime: number) {
    this.relativeTime = relativeTime;
    this.customer = customer;
    this.groupId = customer.email;
    this.id = `${customer.email}-${relativeTime}`;
  }

  getRelativeTime(): number {
    return this.relativeTime;
  }

  getCustomer(): Customer {
    return this.customer;
  }

  getGroupId(): string {
    return this.groupId;
  }

  getId(): string {
    return this.id;
  }

  inSameGroup(task: Task): boolean {
    return this.groupId === task.groupId;
  }

  isSameTask(task: Task): boolean {
    return this.id === task.id;
  }

  /**
   * Creates bulk tasks from customers.
   */
  static fromCustomers(...customers: Customer[]): Task[] {
    const tasks: Task[] = [];
    for (const customer of customers) {
      for (const schedule of customer.schedule) {
        tasks.push(new Task(customer, schedule));
      }
    }
    return tasks;
  }
}
