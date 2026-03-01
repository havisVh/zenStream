
class serverConnect {

    private serverURI: string;

    constructor() { 
        console.log("serverConnect Ready");
        const port = import.meta.env.VITE_serverPort || 2630;
        this.serverURI = window.location.protocol + "//" + window.location.hostname + ":" + port + "/";
        console.log("Server URI: " + this.serverURI);
    }


    async ping(): Promise<string> {
        try{
            const response = await fetch(this.serverURI + "ping");
            const data = await response.text();
            return data;
        }catch(error){
            console.error("Error pinging server:", error);
            return "Error pinging server" + error;
        }
    }

    async serverADDR(): Promise<string> {
        return import.meta.env.VITE_serverURI;
    }

    async triggerIndexing(): Promise<string> {
        try{
            const response = await fetch(this.serverURI + "api/triggerIndex",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
            const data = await response.text();
            return data;
        }catch(error){
            console.error("Error triggering indexing:", error);
            return "Error triggering indexing" + error;
        }
    }


    async getUserData(): Promise<any> {
        try{
                const response = await fetch(this.serverURI + "api/myUserData",{
                    headers: {
                        "Content-Type": "application/json",
                        "X-User": localStorage.getItem("userToken") || ""
                    }
                
            });
            const data = await response.json();
            if (localStorage.getItem("userToken") === null){
                localStorage.setItem("userToken", data.token);
            }
            return data;
        }catch(error){
            console.error("Error getting user data:", error);
            return "Error getting user data" + error;
        }
    }

    async getMovieData(movieId: string): Promise<any> {
        try{
                const response = await fetch(this.serverURI + "api/getMovieDetails",{
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-User": localStorage.getItem("userToken") || ""
                    },
                    body: JSON.stringify({tmdbId:movieId})
            });
            const data = await response.json();
            return data;
        }catch(error){
            console.error("Error getting movie data:", error);
            return "Error getting movie data" + error;
        }
    }

    async getMovieStreamUrl(movieId: string): Promise<string> {
        try{
                const response = await fetch(this.serverURI + "api/playHLS",{
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-User": localStorage.getItem("userToken") || ""
                    },
                    body: JSON.stringify({movieId:movieId.toString()})
            });
            const data = await response.json();
            console.log("Stream URL: " + data.streamURL);
            return data.streamURL;
        }catch(error){
            console.error("Error getting movie stream URL:", error);
            return "Error getting movie stream URL" + error;
        }
    }

}


export default serverConnect;