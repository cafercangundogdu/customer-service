import { Customer } from "../customer";
import { Task } from "./task";

describe("Test task isSameGroup", () => {
  const customer: Customer = new Customer(
    "vdaybell0@seattletimes.com",
    "Hi Vincenty, your invoice about $1.99 is due.",
    "8s-14s-20s"
  );

  const customer2: Customer = new Customer(
    "esealove2@go.com",
    "Hola Elspeth, aun tienes un pago de $4.55 pendiente.",
    "0s-18s"
  );

  const customer1Tasks = Task.fromCustomers(customer);
  const customer2Tasks = Task.fromCustomers(customer2);

  it("Should to be same group", () => {
    for (let i = 1; i < customer1Tasks.length; i++) {
      expect(customer1Tasks[i].inSameGroup(customer1Tasks[i - 1])).toBe(
        true
        //tasks[i - 1].inSameGroup(tasks[i])
      );
    }
  });

  it("Should not to be same group", () => {
    const minTaskLen = Math.min(customer1Tasks.length, customer2Tasks.length);
    for (let i = 1; i < minTaskLen; i++) {
      expect(customer1Tasks[i].inSameGroup(customer2Tasks[i])).toBe(
        false
        //tasks[i - 1].inSameGroup(tasks[i])
      );
    }
  });

  it("should same customer", () => {
    for (const task of customer1Tasks) {
      expect(task.getCustomer().email).toBe(customer.email);
    }
  });

  it("should correct groupId", () => {
    for (let i = 1; i < customer1Tasks.length; i++) {
      expect(customer1Tasks[i].getGroupId()).toBe(
        customer1Tasks[i - 1].getGroupId()
      );
    }
  });

  it("should same id", () => {
    expect(new Task(customer, customer.schedule[0]).getId()).toBe(
      new Task(customer, customer.schedule[0]).getId()
    );
  });

  it("should not same id", () => {
    expect(new Task(customer, customer.schedule[0]).getId()).not.toBe(
      new Task(customer, customer.schedule[1]).getId()
    );
  });
});
