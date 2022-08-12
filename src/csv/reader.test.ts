import "dotenv-defaults/config";
import fs from "fs";
import { BufferedCharReader } from "./reader";

const MockFilePath = "./test-resources/mock.file.txt";

describe("Test reader functionality", () => {
  it("should correct size", () => {
    const charReader = new BufferedCharReader(MockFilePath, 512);
    const stats = fs.statSync(MockFilePath);
    expect(charReader.totalSize).toEqual(stats.size);
    charReader.close();
  });

  it("should correct read char count", async () => {
    const charReader = new BufferedCharReader(MockFilePath, 512);

    const toBeRead = 3;
    for (let i = 0; i < toBeRead; i++) {
      await charReader.readChar();
    }

    expect(charReader.getReadedCharCount()).toBe(toBeRead);

    for (let i = 0; i < toBeRead; i++) {
      await charReader.readChar();
    }

    expect(charReader.getReadedCharCount()).toBe(toBeRead * 2);

    charReader.close();
  });

  it("should read content correctly", async () => {
    const charReader = new BufferedCharReader(MockFilePath, 512);
    const content = "Hello World!ü$€?ç";
    while (!charReader.isEnd()) {
      const char = await charReader.readChar();
      expect(char).toBe(content[charReader.getReadedCharCount() - 1]);
    }
    charReader.close();
  });

  it("should throw err when file not found", async () => {
    expect(() => {
      new BufferedCharReader("wrong file path.txt", 512);
    }).toThrow("no such file or directory");
  });

  it("should null char when file end reach", async () => {
    const charReader = new BufferedCharReader(MockFilePath, 512);
    while (!charReader.isEnd()) {
      await charReader.readChar();
    }
    const nullChar = await charReader.readChar();
    expect(nullChar).toBe(null);
    charReader.close();
  });

  it("should correctly skip to next char", async () => {
    const charReader = new BufferedCharReader(MockFilePath, 512);
    const content = "HloWrdü€ç";
    let readed = "";
    while (!charReader.isEnd()) {
      readed += await charReader.readChar();
      if (charReader.getReadedCharCount() % 1 === 0) {
        charReader.skipNext();
      }
    }
    expect(readed).toBe(content);
    charReader.close();
  });

  it("should correctly read content with overflowed char", async () => {
    /**
     * mock file content is `Hello World!ü$€?ç` with buffersize 15
     * so should overflow € char, but should read correcly content
     */
    const charReader = new BufferedCharReader(MockFilePath, 15);
    const content = "Hello World!ü$€?ç";
    let readed = "";
    while (!charReader.isEnd()) {
      readed += await charReader.readChar();
    }
    expect(readed).toBe(content);
    charReader.close();
  });
});
