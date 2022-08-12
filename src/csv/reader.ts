import EventEmitter from "events";
import fs from "fs";

export class BufferedCharReader {
  private _buffer: Buffer;
  private _offset: number;
  private _bytesRead: number;
  private _charRead: number;

  private _stats: fs.Stats;
  private _fd: number;
  private _cycle: number;

  private _bufferSize: number;

  constructor(filePath: string, bufferSize: number) {
    this._buffer = Buffer.alloc(bufferSize, 0, "utf-8");
    this._offset = 0;
    this._bytesRead = 0;
    this._charRead = 0;
    this._stats = fs.statSync(filePath); // file details
    this._fd = fs.openSync(filePath, "r"); // file descriptor
    this._cycle = 0;
    this._bufferSize = bufferSize;
  }

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

  private async read(): Promise<void> /*Promise<Buffer | null>*/ {
    if (this._bytesRead >= this._stats.size) {
      return; // null;
    }

    let readed = this._bufferSize;
    await this.readBytes(this._fd, this._buffer);
    this._bytesRead = (this._cycle + 1) * this._bufferSize;
    if (this._bytesRead > this._stats.size) {
      // When we reach the end of file,
      // we have to calculate how many bytes were actually read
      readed = this._bufferSize - (this._bytesRead - this._stats.size);
    }

    this._cycle++;
    return; // this._buffer.subarray(0, readed);
  }

  async readChar(): Promise<string | null> {
    if (this.isEnd()) {
      return null;
    }

    if (
      (this._bytesRead == 0 && this._offset == 0) ||
      this._offset >= this._bytesRead
    ) {
      await this.read();
    }

    const relativeOffset = this._offset % this._bufferSize;
    let byte = this._buffer[relativeOffset];

    let charByteLen = 1;
    while ((byte & 0xc0) == 0xc0) {
      byte <<= 1;
      charByteLen++;
    }

    let char = "";
    if (charByteLen === 1) {
      char = String.fromCodePoint(byte);
      this._offset++;
    } else {
      if (this._bytesRead > charByteLen + this._offset + 1) {
        // no need to read
        char = this._buffer.toString(
          "utf-8",
          relativeOffset,
          relativeOffset + charByteLen
        );
        this._offset += charByteLen;
      } else {
        // we will reach the end of buffer, request read
        const backupBytes = Buffer.alloc(charByteLen, 0, "utf-8");
        for (let i = 0; i < charByteLen; i++, this._offset++) {
          if (this._offset >= this._bytesRead) {
            await this.read();
          }
          backupBytes[i] = this._buffer[this._offset % this._bufferSize];
        }

        char = backupBytes.toString("utf-8", 0, backupBytes.length);
      }
    }

    this._charRead++;
    return char;
  }

  step(relativeOffset: number): void {
    this._offset += relativeOffset;
  }

  rollback(): void {
    this.step(-1);
  }

  skipNext(): void {
    this.step(1);
  }

  get totalSize(): number {
    return this._stats.size;
  }

  getReadedCharCount(): number {
    return this._charRead;
  }

  isEnd(): boolean {
    return this._offset >= this._stats.size;
  }

  close(): void {
    fs.close(this._fd);
  }
}
