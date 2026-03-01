
import { config } from "../configParser.ts";
import { join } from "https://deno.land/std@0.201.0/path/join.ts";
import { getUserData,setLastPlayed } from "../lib/userHandling.ts";
import { getSpecificFileData } from "../lib/indexFiles.ts";

interface apiObject{
    request: any;
    requestPath: string;
    method: string;
    headers?: Headers;
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
    }

    else if(
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
    }else if(
        apiReq.requestPath === apiHead+"index" &&
        apiReq.method === "GET"
    ){
        const {getIndexedasJSON} = await import("../lib/indexFiles.ts");
        return new Response(getIndexedasJSON(), { status: 200, headers: { "Content-Type": "application/json" } });
    }else if(
        apiReq.requestPath === apiHead+"triggerIndex" &&
        apiReq.method === "POST"){
        const {index} = await import("../lib/indexFiles.ts");
        await index(servePath);
        return new Response("Indexing Complete", { status: 200 });
        }

        else if(
            apiReq.requestPath === apiHead+"clearIndex" &&
            apiReq.method === "POST"
        ){
            const {clearDatabase} = await import("../lib/indexFiles.ts");
            clearDatabase();
            return new Response("Index cleared", { status: 200 });
        }
        else if(
            apiReq.requestPath === apiHead+"myUserData" &&
            apiReq.method === "GET"
        ){
            const user = apiReq.headers?.get("X-User") || "";
            const userData = getUserData(user);
            return new Response(JSON.stringify(userData), { status: 200, headers: { "Content-Type": "application/json" } });
        }else if(
            apiReq.requestPath === apiHead+"updateUserData" &&
            apiReq.method === "POST" 
        ){
            try {
                const requestBody = await apiReq.request.json();
                const user = apiReq.headers?.get("X-User") || "";
                setLastPlayed(user, requestBody.movieID,requestBody.currentTime);
                return new Response("User data updated", { status: 200 });
            } catch (error) {
                console.error("Error updating user data:", error);
                return new Response("Invalid request body", { status: 400 });
            }
        }else if(
            apiReq.requestPath === apiHead+"getMovieDetails" &&
            apiReq.method === "POST"
        ){
            try {
                const requestBody = await apiReq.request.json();
                const movieDetails = getSpecificFileData(requestBody.tmdbId);
                return new Response(movieDetails, { status: 200, headers: { "Content-Type": "application/json" } });
            } catch (error) {
                console.error("Error fetching movie details:", error);
                return new Response("Invalid request body", { status: 400 });
            }
        }else if (

            apiReq.requestPath === apiHead+"playHLS" &&
            apiReq.method === "POST"
        ){
            try {                
                const requestBody = await apiReq.request.json();
                const movieID = requestBody.movieId;
                if (config.useSeparatePathForProcessing) {
                    servePath = config.processPath + "/" + movieID + "/";
                    const {isHLSConverted, convert2HLS} = await import("../lib/videoHLSConvert.ts");
                    const toParseObj= getSpecificFileData(movieID);
                //    input path is the path of the file from Drivelettre + root + path from database if the externalPath is true, else its the path from database + root
                    const parsedData = JSON.parse(toParseObj);
                    let inputPath = "";
                    if(config.externalPath){
                        inputPath = config.DRIVE_LETTER+":\\"+config.root+"\\"+parsedData.path;
                    }else{
                        inputPath = join(Deno.cwd(), config.root, parsedData.path);
                    }
                    const outputDir = join(servePath, "hls_output", movieID);
                    if (!isHLSConverted(outputDir)) {
                        const conversionResult = await convert2HLS(inputPath, outputDir);
                        if (!conversionResult || !conversionResult.status) {
                            return new Response("Error converting video to HLS", { status: 500 });
                        }else{
                            return new Response(JSON.stringify({ streamURL: "/stream/" + movieID + "/hls_output/" + movieID + "/master.m3u8" }), { status: 200, headers: { "Content-Type": "application/json" } });
                        }
                    }else{
                        return new Response(JSON.stringify({  streamURL: "/stream/" + movieID + "/hls_output/" + movieID + "/master.m3u8"  }), { status: 200, headers: { "Content-Type": "application/json" } });
                    }
                    
                }else{
                    // servePath should be set to the path of the input file's directory

                    servePath = join(Deno.cwd(), config.root,movieID ,"/");
                    const {isHLSConverted, convert2HLS} = await import("../lib/videoHLSConvert.ts");
                    const toParseObj= getSpecificFileData(movieID);
                    const parsedData = JSON.parse(toParseObj);
                    let inputPath = "";
                    if(config.externalPath){
                        inputPath = config.DRIVE_LETTER+":\\"+config.root+"\\"+parsedData.path;
                    }
                    else{
                        inputPath = join(Deno.cwd(), config.root, parsedData.path);
                    }
                    const outputDir = join(servePath, "hls_output", movieID);
                    if (!isHLSConverted(outputDir)) {
                        const conversionResult = await convert2HLS(inputPath, outputDir);
                        if (!conversionResult || !conversionResult.status) {
                            return new Response("Error converting video to HLS", { status: 500 });
                        }else{
                            return new Response(JSON.stringify({ streamURL: "/stream/" + movieID + "/hls_output/" + movieID + "/master.m3u8" }), { status: 200, headers: { "Content-Type": "application/json" } });
                        }

                    }else{
                        // If already converted, return the existing stream URL
                        return new Response(JSON.stringify({ streamURL: "/stream/" + movieID + "/hls_output/" + movieID + "/master.m3u8" }), { status: 200, headers: { "Content-Type": "application/json" } });
                    }
                }
    
            
            }catch (error) {
                console.error("Error processing HLS request:", error);
                return new Response("Invalid request body", { status: 400 });
            }
        }
        
    else{
        return new Response("API endpoint not found", { status: 404 });
    }
    
}

export { apiHandler };

