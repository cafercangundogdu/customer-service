import EventEmitter from "events";
import fs from "fs";

export class BufferedCharReader {
  /**
   * Buffer for readed bytes.
   */
  private _buffer: Buffer;

  /**
   * State of Char offset. Points to buffer index.
   */
  private _offset: number;

  /**
   * State of readed bytes count.
   */
  private _bytesRead: number;

  /**
   * State of readed char count.
   */
  private _charRead: number;

  /**
   * Given file stats.
   */
  private _stats: fs.Stats;

  /**
   * Given file handle.
   */
  private _fd: number;

  /**
   * We are reading file part by part.
   * Cycle is state of nth time read count.
   * Using for transform `offset` to buffer-index.
   */
  private _cycle: number;

  /**
   * Size of allocated buffer.
   */
  private _bufferSize: number;

  constructor(filePath: string, bufferSize: number) {
    /**
     * Allocates a buffer.
     */
    this._buffer = Buffer.alloc(bufferSize, 0, "utf-8");

    /**
     * Default states
     */
    this._offset = 0;
    this._bytesRead = 0;
    this._charRead = 0;
    this._cycle = 0;
    this._bufferSize = bufferSize;

    /**
     * Read file stats
     */
    this._stats = fs.statSync(filePath);

    /**
     * Open file and save handle state.
     */
    this._fd = fs.openSync(filePath, "r"); // file descriptor
  }

  /**
   * Read bytes from given file to buffer.
   * @param fd file handle
   * @param sharedBuffer buffer for store readed bytes
   */
  private readBytes(fd: number, sharedBuffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.read(fd, sharedBuffer, 0, sharedBuffer.length, null, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Reads the given file.
   */
  private async read(): Promise<void> {
    /**
     * If end of file reach don't read.
     */
    if (this._bytesRead >= this._stats.size) {
      return;
    }

    /**
     * initialize `readed` field. defaults bufferSize.
     */
    let readed = this._bufferSize;

    /**
     * Reads the given file bytes to buffer.
     */
    await this.readBytes(this._fd, this._buffer);

    /**
     * Calculate bytes read state.
     */
    this._bytesRead = (this._cycle + 1) * this._bufferSize;
    if (this._bytesRead > this._stats.size) {
      /**
       * When we reach the end of file,
       * we have to calculate how many bytes were actually read
       */
      readed = this._bufferSize - (this._bytesRead - this._stats.size);
    }

    /**
     * switch to next cycle
     */
    this._cycle++;
    return;
  }

  /**
   * Reads one utf-8 char
   */
  async readChar(): Promise<string | null> {
    /**
     * if is end reach, return null.
     */
    if (this.isEnd()) {
      return null;
    }

    /**
     * If we're done with the current buffer,
     * request read next part of file.
     */
    if (
      (this._bytesRead == 0 && this._offset == 0) ||
      this._offset >= this._bytesRead
    ) {
      await this.read();
    }

    /**
     * Get char of current offset.
     */
    const relativeOffset = this._offset % this._bufferSize;
    let byte = this._buffer[relativeOffset];

    /**
     * Detect how many bytes the utf-8 char
     */
    let charByteLen = 1;
    while ((byte & 0xc0) == 0xc0) {
      byte <<= 1;
      charByteLen++;
    }

    /**
     * initialize char field
     */
    let char = "";

    if (charByteLen === 1) {
      /**
       * if its 1-byte char, just convert to char
       */
      char = String.fromCodePoint(byte);

      /**
       * increase offset
       */
      this._offset++;
    } else {
      /**
       * Check is buffer enough to read char.
       * may overflow current char to next buffer.
       */
      if (this._bytesRead > charByteLen + this._offset + 1) {
        /**
         * char is not overflowed. so read it from current buffer
         */
        char = this._buffer.toString(
          "utf-8",
          relativeOffset,
          relativeOffset + charByteLen
        );

        /**
         * increse offset with readed bytes
         */
        this._offset += charByteLen;
      } else {
        /**
         * Current char is overflowed the buffer,
         * So backup current bytes of char
         * and then read the remain part of char from next buffer.
         */
        const backupBytes = Buffer.alloc(charByteLen, 0, "utf-8");
        for (let i = 0; i < charByteLen; i++, this._offset++) {
          if (this._offset >= this._bytesRead) {
            /**
             * If we're done with the current buffer,
             * request read next part
             */
            await this.read();
          }
          /**
           * Calculates offset and read to char buffer.
           */
          backupBytes[i] = this._buffer[this._offset % this._bufferSize];
        }

        /**
         * Convert bytes to utf-8 char
         */
        char = backupBytes.toString("utf-8", 0, backupBytes.length);
      }
    }

    /**
     * increase char read offset.
     */
    this._charRead++;

    /**
     * return the readed char.
     */
    return char;
  }

  /**
   * Steps to given offset.
   * @params relativeOffset Can be negative
   */
  step(relativeOffset: number): void {
    this._offset += relativeOffset;
  }

  /**
   * Skips to previous offset.
   */
  rollback(): void {
    this.step(-1);
  }

  /**
   * Skipts to next offset.
   */
  skipNext(): void {
    this.step(1);
  }

  /**
   * Returns the file size.
   */
  get totalSize(): number {
    return this._stats.size;
  }

  /**
   * Returns the state of readed char count
   */
  getReadedCharCount(): number {
    return this._charRead;
  }

  /**
   * Returns is reach the end of file.
   */
  isEnd(): boolean {
    return this._offset >= this._stats.size;
  }

  /**
   * Closes the file.
   */
  close(): void {
    fs.close(this._fd);
  }
}
