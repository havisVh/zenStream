import {serveFile} from "https://deno.land/std@0.201.0/http/file_server.ts";
import { config } from "./configParser.ts";
import { join } from "https://deno.land/std@0.201.0/path/join.ts";
import { apiHandler } from "./api/apiRequestHandler.ts";

async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    let filePath = url.pathname;

    if (filePath === "/") {
        filePath = filePath.substring(1);
    }
    if(filePath.startsWith("/api/")){
        return apiHandler({
            requestPath: filePath,
            method: req.method,
        });
    }
    
    let absolutePath = "";
    const decodedPath = decodeURIComponent(filePath);
    if(config.externalPath){
        absolutePath = decodedPath;
        console.log(absolutePath);
        if(absolutePath.startsWith("/~")){
            absolutePath = absolutePath.replace("/~", "GX");
        }
        const user = Deno.env.get("USER") || Deno.env.get("USERNAME") || "user";
        
        if(absolutePath.startsWith("/")){
            absolutePath = config.DRIVE_LETTER+":\\"+config.root+absolutePath.substring(1).replaceAll("/","\\");
        }else if(absolutePath.startsWith("GX")){
            absolutePath = "C:\\Users\\"+user+"\\"+config.root+absolutePath.replace("GX", "").replaceAll("/","\\");
            console.log(absolutePath);
        }
    }else{
        absolutePath = join(Deno.cwd(),config.root, decodedPath);
    }

    
    try{

        const fileInfo = await Deno.stat(absolutePath);

        
        if(fileInfo.isDirectory){
            return new Response("Directory listing is not allowed", { status: 403 });
        }

        return await serveFile(req, absolutePath);
    }catch(error){
        if(error instanceof Deno.errors.NotFound){
            return new Response("File not found", { status: 404 });
        }
        return new Response("Internal Server Error", { status: 500 });
    }
  
  
    
}

export { handler };