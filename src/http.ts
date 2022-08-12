import http, { RequestOptions } from "http";

/**
 * Payment post type
 */
export type MessagePostData = {
  email: string;
  text: string;
};

/**
 * Payment response type
 */
export type PaymentResponse = {
  status: number;
  paid?: boolean;
};

/**
 * Endpoint settings
 */
export enum Endpoint {
  Messages = "messages",
}

/**
 * Class HttpAPI for http operations.
 */
export class HttpAPI {
  /**
   * Connection options per Endpoint
   */
  endpointConnectionOptions: { [key in Endpoint]: RequestOptions };
  constructor(overrideOptions: { [key in Endpoint]?: RequestOptions } = {}) {
    /**
     * Sets default connection options,
     * override options if specified with params.
     */
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

  /**
   * Sends Post request to /messages endpoint
   * @param data
   * @param onSocketOpen
   * @returns
   */
  async checkPayment(
    data: MessagePostData,
    onSocketOpen?: () => void | undefined
  ): Promise<PaymentResponse> {
    return new Promise(async (resolve, reject) => {
      /**
       * Create post data
       */
      const encodedData: MessagePostData = {
        email: data.email,
        text: encodeURI(data.text),
      };

      /**
       * Serialize to json string
       */
      const dataStr = JSON.stringify(encodedData);

      /**
       * Create http request with options
       */
      const req = http.request(
        this.endpointConnectionOptions[Endpoint.Messages],
        (res) => {
          /**
           * If status code is undefined, rejects the promise
           */
          if (!res.statusCode) {
            reject();
          }

          /**
           * Reads chunked data
           */
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          /**
           * Listen response end event
           */
          res.once("end", () => {
            /**
             * When response done, parse it end resolve promise
             */
            const body = JSON.parse(data);
            resolve({
              status: res.statusCode ?? -1,
              paid: body["paid"],
            });
          });
        }
      );

      /**
       * Listen socket open event
       */
      req.once("socket", () => {
        if (onSocketOpen) {
          onSocketOpen();
        }
      });

      /**
       * Listen connection error event
       */
      req.once("error", (err) => {
        console.error(err);
        reject();
      });

      /**
       * Write serialized data to request
       */
      req.write(dataStr);

      /**
       * End request
       */
      req.end();
    });
  }
}
