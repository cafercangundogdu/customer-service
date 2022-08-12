import EventEmitter from "events";

export enum WorkerType {
  PRIMARY = "primary",
  CSV = "csv",
  TASK_QUEUE = "task_queue",
  TASK_SEND = "task_send",
}

export type WorkerOutputMessageType = {
  // target: WorkerType;
};

export type WorkerInputMessageType = {};

interface WorkerEvents<
  I extends WorkerInputMessageType,
  O extends WorkerOutputMessageType
> {
  input: (message: I) => void;
  output: (message: O) => void;
  stop: () => void;
}

export declare interface Worker<
  I extends WorkerInputMessageType,
  O extends WorkerOutputMessageType
> {
  getType(): string;

  run(): Promise<void>;

  send(...args: Parameters<WorkerEvents<I, O>["input"]>): void;

  emit<U extends keyof WorkerEvents<I, O>>(
    event: U,
    ...args: Parameters<WorkerEvents<I, O>[U]>
  ): boolean;

  on<U extends keyof WorkerEvents<I, O>>(
    event: U,
    listener: WorkerEvents<I, O>[U]
  ): this;
}

export class Worker<
  I extends WorkerInputMessageType = WorkerInputMessageType,
  O extends WorkerOutputMessageType = WorkerOutputMessageType
> extends EventEmitter {
  constructor() {
    super();
  }

  send(message: I): void {
    this.emit("input", message);
  }
}
