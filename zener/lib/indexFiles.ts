import { DatabaseSync } from 'node:sqlite';
const database = new DatabaseSync('/film.db');
import {metaExtract} from "./metaExtract.ts";
import { searchMovie } from "./tmdb.ts";
import { dir } from "node:console";




database.exec(`
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    year TEXT,
    language TEXT,
    file_type TEXT,
    file_format TEXT,
    tmdbId INTEGER,
    release_date TEXT,
    poster TEXT,
    backdrop TEXT,
    genres TEXT,
    overview TEXT,
    runtime INTEGER,
    original_language TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);


database.exec(`
    CREATE TABLE IF NOT EXISTS notIndexed (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);


const clearDatabase = () => {
    database.exec(`
        DELETE FROM files;
        DELETE FROM notIndexed;
        `);
}

const insertFile = (file: {title: string, 
    path: string, 
    size: number, 
    year?: string, 
    language?: string, 
    file_type?: string, 
    file_format?: string,
    tmdbId?: number,
    release_date?: string,
    poster?: string,
    backdrop?: string,
    genres?: string,
    overview?: string,
    runtime?: number,
    original_language?: string}) => {

        database.exec(`
        INSERT INTO files (title, path, size, year, language, file_type, file_format, tmdbId, release_date, poster, backdrop, genres, overview, runtime, original_language)
        VALUES (
            '${file.title.replaceAll("'", "''")}', 
            '${file.path.replaceAll("'", "''")}', 
            ${file.size}, 
            '${file.year}', 
            '${file.language ? file.language.replaceAll("'", "''") : ""}', 
            '${file.file_type ? file.file_type.replaceAll("'", "''") : ""}', 
            '${file.file_format ? file.file_format.replaceAll("'", "''") : ""}',
            '${file.tmdbId ? file.tmdbId : 0}',
            '${file.release_date ? file.release_date.replaceAll("'", "''") : ""}',
            '${file.poster ? file.poster.replaceAll("'", "''") : ""}',
            '${file.backdrop ? file.backdrop.replaceAll("'", "''") : ""}',
            '${file.genres ? file.genres.replaceAll("'", "''") : ""}',
            '${file.overview ? file.overview.replaceAll("'", "''") : ""}',
            ${file.runtime || 0},
            '${file.original_language ? file.original_language.replaceAll("'", "''") : ""}'
        );
        `);

}

const insertNotIndexed = (title: string, path: string) => {
    database.exec(`
        INSERT INTO notIndexed (title, path)
        VALUES (
            '${title.replaceAll("'", "''")}',
            '${path.replaceAll("'", "''")}'
        );
    `);
}

const lengthOfIndex = (): number => {
    const result = database.prepare("SELECT COUNT(*) as count FROM files").get();
    if (!result) {
        return 0;
    }
    const count = (result.count as number) || 0;
    return count;
}


const getINXJSON = (): string => {
    const result = database.prepare("SELECT title, path, size, year, language, file_type, file_format, tmdbId, release_date, poster, backdrop, genres, overview, runtime, original_language FROM files");
    const files =result.all();
    return JSON.stringify(files);
}

const isIndexCompleted = (): number => {
    const result = database.prepare("SELECT COUNT(*) as count FROM files").get();
    if (!result) {
        return 0;
    }
    const count = (result.count as number) || 0;
    return count;
}

const index = async (directory:string) => {
    for await (const dirEntry of Deno.readDir(directory)) {
        const entryPath = directory + "/" + dirEntry.name;
        

        if (dirEntry.isDirectory) {
            await index(entryPath);
        } else if (dirEntry.isFile) {
            const existing = database.prepare("SELECT id FROM files WHERE path = ?").get(dirEntry.name);
            
            if(existing){
                // console.log(`File already indexed: ${entryPath}`);
                continue;
            }
            const fileInfo = await Deno.stat(entryPath);
            // if files is not mp4/mkv/avi/mov skip
            const ext = entryPath.split('.').pop()?.toLowerCase();
            if(!ext || !["mp4","mkv","avi","mov"].includes(ext)){
                // console.log(`Unsupported file format: ${entryPath}`);
                continue;
            }
            const fileData = await metaExtract(dirEntry.name);
            try{
                
                const tmdbData = await searchMovie(fileData.title,{lang:fileData.language || "en", year: fileData.year || ""});
                insertFile({
                title: fileData.title,
                year: fileData.year,
                language: fileData.language,
                file_type: fileInfo.isFile ? "video" : "",
                file_format: fileInfo.isFile ? entryPath.split('.').pop() || "" : "",
                path: dirEntry.name,
                size: fileInfo.size,
                tmdbId: tmdbData.tmdbId,
                release_date: tmdbData.release_date,
                poster: tmdbData.poster,
                backdrop: tmdbData.backdrop,
                genres: tmdbData.genres,
                overview: tmdbData.overview,
                runtime: tmdbData.runtime,
                original_language: tmdbData.original_language
            });

            }catch(error){
                console.error(`Error fetching TMDB data for ${fileData.title}:`, error);
                insertNotIndexed(fileData.title, dirEntry.name);

            }


        }
    }

}


const getSpecificFileData = (tmdbId: string):string => {
    const result = database.prepare("SELECT title, path, size, year, language, file_type, file_format, tmdbId, release_date, poster, backdrop, genres, overview, runtime, original_language FROM files WHERE tmdbId = ?").get(parseInt(tmdbId));

    if (!result) {
        return JSON.stringify({ error: "File not found" });
    }else{
        return JSON.stringify(result);
    }
}


export {index,getINXJSON as getIndexedasJSON, clearDatabase, lengthOfIndex, isIndexCompleted, getSpecificFileData};


