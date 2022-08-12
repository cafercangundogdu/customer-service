import { Customer, TimeFormatError } from "./customer";

describe("Test customer", () => {
  const customer = new Customer(
    "vdaybell0@seattletimes.com",
    "Hi Vincenty, your invoice about $1.99 is due.",
    "0s-2s-4s"
  );

  const customer2 = Customer.createCustomerFromRow({
    email: "vdaybell0@seattletimes.com",
    text: "Hi Vincenty, your invoice about $1.99 is due.",
    schedule: "0s-2s-4s",
  });

  it("should parse schedule correctly", () => {
    expect(Customer.parseSchedule("0s-2s-4s")).toStrictEqual([0, 2, 4]);
  });

  it("should throw error when parsing schedule", () => {
    expect(() => Customer.parseSchedule("0m-2m-4m")).toThrow(TimeFormatError);
  });

  it("should same customer", () => {
    expect(customer.email).toBe(customer2.email);
    expect(customer.text).toBe(customer2.text);
    expect(customer.schedule).toStrictEqual(customer2.schedule);
  });
});
