import "dotenv-defaults/config";
import { CsvParser, Row } from "./csv";

describe("Test CSV_FILE_RELATIVE_PATH environment", () => {
  const csvFilePath = process.env.CSV_FILE_RELATIVE_PATH;

  it("should be set", () => {
    expect(csvFilePath).not.toBe(undefined);
  });
});

describe("Test parse header correctly", () => {
  const csvFilePath = process.env.CSV_FILE_RELATIVE_PATH;
  const csvParser = new CsvParser(csvFilePath as string);

  it("should emit header correctly", async () => {
    csvParser.parse();
    const headers = await new Promise<string[]>((resolve, reject) => {
      csvParser.on("header", (header: string[]) => {
        resolve(header);
      });
    });
    expect(["email", "text", "schedule"]).toStrictEqual(headers);
    csvParser.stop();
  });
});

describe("Test parse first row correctly", () => {
  const csvFilePath = process.env.CSV_FILE_RELATIVE_PATH;

  const csvParser = new CsvParser(csvFilePath as string);
  let csvHeader: string[] = [];
  let csvRows: Row[] = [];

  csvParser.on("header", (header: string[]) => {
    csvHeader.push(...header);
  });

  it("should emit first row correctly", async () => {
    csvParser.parse();
    const row = await new Promise<Row>((resolve, reject) => {
      csvParser.on("row", (row: Row) => {
        resolve(row);
      });
    });
    csvParser.stop();

    expect(Object.keys(row)).toEqual(csvHeader);

    expect(Object.values(row)).toEqual([
      "vdaybell0@seattletimes.com",
      "Hi Vincenty, your invoice about $1.99 is due.",
      "8s-14s-20s",
    ]);

    csvRows.push(row);
  }, 30000);
});

describe("Test all rows correctly", () => {
  const correctRows: Row[] = [
    {
      email: "vdaybell0@seattletimes.com",
      text: "Hi Vincenty, your invoice about $1.99 is due.",
      schedule: "8s-14s-20s",
    },
    {
      email: "esealove2@go.com",
      text: "Hola Elspeth, aun tienes un pago de $4.55 pendiente.",
      schedule: "0s-18s",
    },
    {
      email: "bskentelberyl@mozilla.org",
      text: "Dear Mr. Skentelbery, you still have an outstanding amount of $152.87 for your loan.",
      schedule: "3s-7s-18s",
    },
    {
      email: "charrimanr@ucla.edu",
      text: "Hello Charin, we want to remind you, that your payment of $12.09 is still outstanding",
      schedule: "6s",
    },
    {
      email: "rforrester11@indiegogo.com",
      text: "Hallo Ricki, für deine Bestellung über 72.56€ konnten wir leider noch keine Zahlung feststellen.",
      schedule: "2s-11s-19s",
    },
  ];

  const csvFilePath = process.env.CSV_FILE_RELATIVE_PATH;

  const csvParser = new CsvParser(csvFilePath as string);
  let csvHeader: string[] = [];
  let csvRows: Row[] = [];

  it("should parse rows correctly", async () => {
    csvParser.on("header", (header: string[]) => {
      csvHeader.push(...header);
    });

    csvParser.on("row", (row: Row, rowIndex: number) => {
      // console.log("row", row);
      expect(Object.keys(row)).toEqual(csvHeader);
      expect(correctRows[rowIndex]).toStrictEqual(row);
    });

    /*
    csvParser.on("end", () => {
      resolve();
    });
    */
    await csvParser.parse();
  }, 30000);
});
