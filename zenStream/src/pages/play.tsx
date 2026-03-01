import {useParams} from 'react-router-dom';
import './play.css';
import {getMovieDetails, getMovieStreamUrl} from "../lib/playerHelper";
import { useEffect, useState } from 'react';
import { VideoJS } from '../lib/videojs';


const Player = () => {
    const { mediaId } = useParams<{ mediaId: string }>();
    const [streamPath, setStreamPath] = useState("");
    const [movieData, setMovieData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchMovieDetails = async () => {
            try {
                const movieData = await getMovieDetails(mediaId);
                    setMovieData(movieData);
                const streamUrl = await getMovieStreamUrl(movieData);
                    setStreamPath(streamUrl);
                    setLoading(false);
            } catch (error) {
                console.error('Error fetching movie details:', error);
            }
        };
        fetchMovieDetails();
    },[mediaId])

    return (<>
        <div className="FullWidth FullHeight Player">
            {loading? <div className="Loading" style={{textAlign:"center"}}>
                Loading <br></br>
                    <i>Streaming A movie for the first time may take some time (Roughly 1-2 mins tops), please bare with us</i>
                </div> :
                <video controls autoPlay className="VideoPlayer" style={{width:"100%"}}>
                    <source src={streamPath} type="application/x-mpegURL" />
                    Your browser does not support the video tag.
                </video>
            //    <VideoJS options={{
            //     autoplay: false,
            //     controls: true,
            //     muted: false,
            //     sources: [{
            //         src: streamPath,
            //         type: 'application/x-mpegURL'
            //     }]
            // }} onReady={(player) => {
            //     console.log("Player is ready:", player);
            // }
            // } />
            
            }
         
        </div>
    </>)
}


export default Player;