// https://www.rfc-editor.org/rfc/rfc4180.html
import { EventEmitter } from "stream";
import { BufferedCharReader } from "./reader";

//export type Row = { [key in string]: string };
// export type Row<T extends string = string> = { [key in T]: string };
export type Row = Record<string, string>;

interface CsvReaderEvents {
  header: (header: string[]) => void;
  // row: (row: string[], rowIndex: number) => void;
  row: (row: { [key in string]: string }, rowIndex: number) => void;
  column: (column: string, columnIndex: number, rowIndex: number) => void;
  end: () => void;
}

export declare interface CsvParser {
  parse(deliminer: string): Promise<void>;

  emit<U extends keyof CsvReaderEvents>(
    event: U,
    ...args: Parameters<CsvReaderEvents[U]>
  ): boolean;

  on<U extends keyof CsvReaderEvents>(
    event: U,
    listener: CsvReaderEvents[U]
  ): this;
}

export class CsvParser extends EventEmitter {
  private filepath: string;
  private inQuote: boolean;
  private stopRequested: boolean;
  constructor(filepath: string) {
    super();
    this.filepath = filepath;
    this.inQuote = false;
    this.stopRequested = false;
  }

  stop(): void {
    this.stopRequested = true;
  }

  parse(deliminer: string = ",", hasHeaders: boolean = true): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const reader = new BufferedCharReader(this.filepath, 9);

      const rowBuffer: string[] = [];
      const header: string[] = [];
      let row = 0;
      let column = 0;

      while (!reader.isEnd() && !this.stopRequested) {
        if (!rowBuffer[column]) {
          rowBuffer[column] = "";
        }
        const char = await reader.readChar();

        if (char === '"') {
          if (this.inQuote) {
            let nextChar = await reader.readChar();
            if (nextChar === '"') {
              // its a escaped quote, so continue reading..
              rowBuffer[column] += nextChar;
              continue;
            } else {
              // regular char..
              reader.rollback();
              this.inQuote = false;
            }
          } else {
            this.inQuote = true;
          }
        } else if (this.inQuote) {
          rowBuffer[column] += char;
        } else if (char === deliminer) {
          this.emit("column", rowBuffer[column], column, row);
          column++;
        } else if (char === "\n") {
          if (hasHeaders && row === 0) {
            header.push(...rowBuffer);
            this.emit("header", header);
          } else {
            this.emit(
              "row",
              rowBuffer.reduce(
                (
                  obj: { [key in string]: string },
                  column: string,
                  i: number
                ) => ({
                  ...obj,
                  [header[i]]: column,
                }),
                {}
              ),
              row - 1
            );
          }
          row++;
          column = 0;
          rowBuffer.length = 0; // clear the buffer
        } else {
          rowBuffer[column] += char;
        }
      }

      this.emit("end");
      resolve();
    });
  }
}
