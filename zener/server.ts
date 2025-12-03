import { handler } from "./handler.ts";
import { config } from "./configParser.ts";

function runServer() {
    console.log(`Server running at http://${config.hostname}:${config.port}/`);
    Deno.serve({port :config.port,hostname: config.hostname}, handler);
}

export { runServer };