import "dotenv-defaults/config";
import { PrimaryWorker } from "./workers/primary";

/**
 * Create primary service and run
 */
new PrimaryWorker().run();
