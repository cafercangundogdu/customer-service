import "dotenv-defaults/config";
import { Primary } from "./workers/primary";

new Primary().run();
