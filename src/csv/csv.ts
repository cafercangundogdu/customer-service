// https://www.rfc-editor.org/rfc/rfc4180.html
import { EventEmitter } from "stream";
import { BufferedCharReader } from "./reader";

/**
 * Type of csv row
 */
export type Row = Record<string, string>;

/**
 * Csv Reader Event interface
 */
interface CsvParserEvents {
  /**
   * Emitted when csv parse header
   */
  header: (header: string[]) => void;
  /**
   * Emitted when csv parse a row
   */
  row: (row: { [key in string]: string }, rowIndex: number) => void;
  /**
   * Emitted when csv parse a column
   */
  column: (column: string, columnIndex: number, rowIndex: number) => void;
  /**
   * Emitted when csv parser reach end of file
   */
  end: () => void;
}

/**
 * CsvParser Interface
 */
export declare interface CsvParser {
  /**
   *
   * @param deliminer Csv column deliminer, defaults ','
   */
  parse(deliminer: string): Promise<void>;

  /**
   * Override Event emitter emit method with CsvParserEvents paramaters
   * @see `EventEmitter.emit`
   * @see `CsvParserEvents`
   */
  emit<U extends keyof CsvParserEvents>(
    event: U,
    ...args: Parameters<CsvParserEvents[U]>
  ): boolean;

  /**
   * Override Event emitter on method with CsvParserEvents paramaters
   * @see `EventEmitter.emit`
   * @see `CsvParserEvents`
   */
  on<U extends keyof CsvParserEvents>(
    event: U,
    listener: CsvParserEvents[U]
  ): this;
}
/**
 * CsvParser is parser of csv file.
 */
export class CsvParser extends EventEmitter {
  /**
   * file path to be processed.
   */

  private filepath: string;
  /**
   * state of column is quoted.
   */

  private inQuote: boolean;
  /**
   * flag for stop parsing
   */
  private stopRequested: boolean;

  /**
   * CsvParser constructor, initialize fields.
   */
  constructor(filepath: string) {
    super();
    this.filepath = filepath;
    this.inQuote = false;
    this.stopRequested = false;
  }

  /**
   * Sets stop flag to true
   */
  stop(): void {
    this.stopRequested = true;
  }

  /**
   * Parses the given csv file and emits events
   * @param deliminer Csv column deliminer, defaults ','
   * @param hasHeaders if Csv file has headers, first row should be header, defaults 'true'
   */
  parse(deliminer: string = ",", hasHeaders: boolean = true): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const reader = new BufferedCharReader(this.filepath, 1024);

        /**
         * keeps row parts in memory while the row is being processed
         */
        const rowBuffer: string[] = [];

        /**
         * keeps header in memory while the entire file is being processed
         */
        const header: string[] = [];

        /**
         * state of current row index
         */
        let row = 0;

        /**
         * state of current column index
         */
        let column = 0;

        /**
         * Loop for reading entrie file
         */
        while (!reader.isEnd() && !this.stopRequested) {
          /**
           * check and initialize array for given index
           */
          if (!rowBuffer[column]) {
            rowBuffer[column] = "";
          }

          /**
           * readed char
           */
          const char = await reader.readChar();

          /**
           * check is char quote
           */
          if (char === '"') {
            /**
             * check state of column is quoted already
             */
            if (this.inQuote) {
              /**
               * if current char is quote and column is already quoted, check next char is quote.
               */
              let nextChar = await reader.readChar();

              /**
               * check next char is quote
               */
              if (nextChar === '"') {
                /**
                 * so current char is escaping the next quote.
                 * adds to row buffer.
                 */
                rowBuffer[column] += nextChar;
                continue;
              } else {
                /**
                 * current quote char is point to end of column.
                 * so rollback readed next char.
                 */
                reader.rollback();

                /**
                 * set state of quoted to false.
                 */
                this.inQuote = false;
              }
            } else {
              /**
               * if state of quoted false, current char point to start of column.
               */
              this.inQuote = true;
            }
          } else if (this.inQuote) {
            /**
             * if already in quote, read to rowBuffer.
             */
            rowBuffer[column] += char;
          } else if (char === deliminer) {
            /**
             * if column deliminer detected, emit colomn event.
             */
            this.emit("column", rowBuffer[column], column, row);

            /**
             *  switch to next column index.
             */
            column++;
          } else if (char === "\n") {
            /**
             * if char is line deliminer, points to end of row.
             */
            if (hasHeaders && row === 0) {
              /**
               * if csv file has header and row index is 0 its a header row.
               * push to header buffer and emit the header event.
               */
              header.push(...rowBuffer);
              this.emit("header", header);
            } else {
              /**
               * its a row, so create Row object from rowBuffer and emit the row event with row index
               */
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

            /**
             * switch to next row
             */
            row++;

            /**
             * reset column flag to 0
             */
            column = 0;

            /**
             * clears the row buffer
             */
            rowBuffer.length = 0;
          } else {
            /**
             * if above conditions false, just read char to rowBuffer.
             */
            rowBuffer[column] += char;
          }
        }

        /**
         * reach end of file, emit end event and resolve promise.
         */
        this.emit("end");
        resolve();
      } catch (e) {
        /**
         * if has an error while processing file, call reject with error
         */
        reject(e);
      }
    });
  }
}
