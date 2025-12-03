import { runServer } from "./zener/server.ts";

if (import.meta.main) {
    await runServer();
}