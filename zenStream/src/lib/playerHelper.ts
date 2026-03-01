

import serverConnect from "./serverConnect";

const serverConnectInstance = new serverConnect();

const getMovieDetails = async (mediaId: string) => {
    // console.log("Fetching movie details for mediaId:", mediaId);
    const response = await serverConnectInstance.getMovieData(mediaId);
    // console.log("Received response for movie details:", response);
    return response;
};

const getMovieStreamUrl = async (movieData) => {
    const port = import.meta.env.VITE_serverPort || 2630;
    const serverURI = window.location.protocol + "//" + window.location.hostname + ":" + port + "/";
    if(movieData.file_format !== "mkv"){
        return serverURI + movieData.path;
    }
    else{
        return serverURI.replace(/\/$/, "") + (await serverConnectInstance.getMovieStreamUrl(movieData.tmdbId));
    }
};


export { getMovieDetails, getMovieStreamUrl };