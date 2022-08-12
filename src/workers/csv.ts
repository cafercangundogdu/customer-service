import { CsvParser } from "../csv/csv";
import {
  Worker,
  WorkerInputMessageType,
  WorkerOutputMessageType,
} from "./worker";

export type CsvWorkerOutputMessageType = WorkerOutputMessageType & {
  row: { [key: string]: string };
  rowIndex: number;
};

export type CsvWorkerInputMessageType = WorkerInputMessageType & {};

export class CsvWorker extends Worker<
  CsvWorkerInputMessageType,
  CsvWorkerOutputMessageType
> {
  constructor() {
    super();
  }

  run(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        this.on("stop", () => {
          resolve();
        });
        const csvFilePath = process.env.CSV_FILE_RELATIVE_PATH;
        if (!csvFilePath) {
          reject("Please ensure CSV_FILE_RELATIVE_PATH enviroment set!");
          return;
        }

        const parser = new CsvParser(csvFilePath);

        parser.on("row", (row: { [key: string]: string }, rowIndex: number) => {
          this.emit("output", {
            row,
            rowIndex,
          });
        });

        await parser.parse();
      } catch (e) {
        reject(e);
      }
    });
  }
}
