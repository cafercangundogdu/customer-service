import EventEmitter from "events";

/**
 * Specifies worker types
 */
export enum WorkerType {
  PRIMARY = "primary",
  CSV = "csv",
  TASK_QUEUE = "task_queue",
  TASK_SEND = "task_send",
}

/**
 * Base Worker output message type
 */
export type WorkerOutputMessageType = {
  // target: WorkerType;
};

/**
 * Base Worker input message type
 */
export type WorkerInputMessageType = {};

/**
 * Base Worker Event Interface
 */
interface WorkerEvents<
  I extends WorkerInputMessageType,
  O extends WorkerOutputMessageType
> {
  input: (message: I) => void;
  output: (message: O) => void;
  stop: () => void;
}

/**
 * Worker Interface
 */
export declare interface Worker<
  I extends WorkerInputMessageType,
  O extends WorkerOutputMessageType
> {
  /**
   * Returns type of worker
   */
  getType(): string;

  /**
   * Starts the worker main logic
   */
  run(): Promise<void>;

  /**
   * Shortcut for input event emit, sends message to this worker
   */
  send(...args: Parameters<WorkerEvents<I, O>["input"]>): void;

  /**
   * @see `EventEmitter.emit`
   */
  emit<U extends keyof WorkerEvents<I, O>>(
    event: U,
    ...args: Parameters<WorkerEvents<I, O>[U]>
  ): boolean;

  /**
   * @see `EventEmitter.on`
   */
  on<U extends keyof WorkerEvents<I, O>>(
    event: U,
    listener: WorkerEvents<I, O>[U]
  ): this;
}

/**
 * Base worker class
 */
export class Worker<
  I extends WorkerInputMessageType = WorkerInputMessageType,
  O extends WorkerOutputMessageType = WorkerOutputMessageType
> extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Emits input event for receiving message
   */
  send(message: I): void {
    this.emit("input", message);
  }
}
