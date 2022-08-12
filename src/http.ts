import http, { RequestOptions } from "http";

export type MessagePostData = {
  email: string;
  text: string;
};

export type PaymentResponse = {
  status: number;
  paid?: boolean;
};

export enum Endpoint {
  Messages = "messages",
}

export class HttpAPI {
  endpointConnectionOptions: { [key in Endpoint]: RequestOptions };
  constructor(overrideOptions: { [key in Endpoint]?: RequestOptions } = {}) {
    this.endpointConnectionOptions = {
      [Endpoint.Messages]: {
        hostname: "localhost",
        port: 9090,
        path: "/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      ...overrideOptions,
    };
  }

  async checkPayment(
    data: MessagePostData,
    onSocketOpen?: () => void | undefined
  ): Promise<PaymentResponse> {
    return new Promise(async (resolve, reject) => {
      const encodedData: MessagePostData = {
        email: data.email,
        text: encodeURI(data.text),
      };
      const dataStr = JSON.stringify(encodedData);

      const req = http.request(
        this.endpointConnectionOptions[Endpoint.Messages],
        (res) => {
          if (!res.statusCode) {
            reject();
          }

          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.once("end", () => {
            // console.log("response: ", data);
            const body = JSON.parse(data);
            resolve({
              status: res.statusCode ?? -1,
              paid: body["paid"],
            });
          });
        }
      );

      req.once("socket", () => {
        if (onSocketOpen) {
          onSocketOpen();
        }
      });

      req.once("error", (err) => {
        console.error(err);
        reject();
      });

      req.write(dataStr);
      req.end();
    });
  }
}
