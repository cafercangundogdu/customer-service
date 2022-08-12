import "dotenv-defaults/config";
import { Primary } from "./workers/primary";

/**
 * Create primary service and run
 */
new Primary().run();
