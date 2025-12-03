
import { config } from "../configParser.ts";
import { join } from "https://deno.land/std@0.201.0/path/join.ts";

interface apiObject{
    requestPath: string;
    method: string;
}

let servePath = ""
if(config.externalPath){
    servePath = config.DRIVE_LETTER+":\\"+config.root;
}else{
    servePath = join(Deno.cwd(), config.root);
}

 

const apiHead = "/api/";
async function apiHandler(apiReq: apiObject): Promise<Response> {
    
    if(
        apiReq.requestPath === apiHead+"status" &&
        apiReq.method === "GET"
    ){
        const status = {
            status: "ok",
            os: Deno.build.os,
        };
        return new Response(JSON.stringify(status), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }else if(
        apiReq.requestPath === apiHead+"echo" &&
        apiReq.method === "GET"
    ){
        const echoData = {
            message: "This is an echo response",
        };
        return new Response(JSON.stringify(echoData), { status: 200, headers: { "Content-Type": "application/json" } });
    }else if(
        apiReq.requestPath === apiHead+"files" &&
        apiReq.method === "GET"
    ){
        try {
            
            const files: string[] = [];


            for await (const dirEntry of Deno.readDir(servePath+"\\")) {
                files.push(dirEntry.name);
            }
            return new Response(JSON.stringify(files), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (_error) {
            return new Response("Error reading files", { status: 500 });
        }
    }
    
    else{
        return new Response("API endpoint not found", { status: 404 });
    }
}

export { apiHandler };