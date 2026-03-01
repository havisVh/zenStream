import { handler } from "./handler.ts";
import { config } from "./configParser.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization,X-User",
    "Access-Control-Allow-Credentials": "true",
};

function withCorsHeaders(response: Response): Response {
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
        headers.set(key, value);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

function runServer() {
    console.log(`Server running at http://${config.hostname}:${config.port}/`);
    Deno.serve({port :config.port,hostname: config.hostname}, async (req) => {
        if (req.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        const response = await handler(req);
        return withCorsHeaders(response);
    });
}

export { runServer };