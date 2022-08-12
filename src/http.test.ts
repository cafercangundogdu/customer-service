import { Customer } from "./customer";
import { HttpAPI } from "./http";

describe("Test HTTP API functionality", () => {
  it("should work correctly", async () => {
    const customer = new Customer(
      "vdaybell0@seattletimes.com",
      "Hi Vincenty, your invoice about $1.99 is due.",
      "0s"
    );
    const httpAPI = new HttpAPI();
    const response = await httpAPI.checkPayment(
      {
        email: customer.email,
        text: customer.text,
      },
      () => {}
    );

    expect("status" in response).toBe(true);
    expect(response.status).toBe(201);

    expect("paid" in response).toBe(true);
    expect(typeof response.paid).toBe("boolean");
  });
});
