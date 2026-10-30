import "../master.css";
import ServerConnect from "../lib/ServerConnect.ts";
import { useState, useEffect } from "react";
import { processImage, setCSSVariables } from "../lib/process.ts";
import { IonContent, IonPage, IonIcon } from "@ionic/react";
import { play } from "ionicons/icons";
import {HSAP, HSAPElementSettings, IntersectionProp} from "../lib/Hsap.ts";
import { getAccentColor, rgbToHex } from "../lib/colors.ts";
import { ThemeToggle } from "../components/ThemeToggle";

const TvDash = () => {
  const [online, setOnline] = useState(false);
  const [dominantColor, setDominantColor] = useState("#000000");
  const [palette, setPalette] = useState(["#000000"]);
  const [userData, setUserData] = useState({});

  const [movieData, setMovieData] = useState({
    title: "Little Hearts",
    year: "05/09/2025 (IN)",
    genre: "Comedy, Romance, and Drama",
    duration: "2h 8m",
    rating: "U/A 10+",
    language: "Telugu",
  });

  const [imgUrl, setImgUrl] = useState(
    "https://image.tmdb.org/t/p/w1920_and_h1080_face/wN0epLoxu8pbvde68M9IZG5T8eD.jpg",
  );

  useEffect(() => {
    const hsapSettings: HSAPElementSettings = {
      className: "ContinueWatchingSection",
      transitionProperty: "top",
      intersectionRatio: [0, 1],
      transitionValue: [0, 8],
      transitionUnit: "vh"
    };

    const intersectionProp: IntersectionProp = {
      root: null,
      rootMargin: "0px",
      scrollMargin: "0px",
      threshold: [0, 1],
    };

    const hsap = new HSAP(hsapSettings, intersectionProp);
  }, []);

  useEffect(() => {
    const serverConnect = new ServerConnect();
    serverConnect
      .ping()
      .then((res) => {
        if (res === "pong") {
          setOnline(true);
        } else {
          setOnline(false);
        }
      })
      .catch((err) => {
        console.error("Error pinging server:", err);
        setOnline(false);
      });

    getAccentColor(imgUrl)
      .then((rgb) => {
        const hexColor = rgbToHex(rgb);
        setDominantColor(hexColor);
        setCSSVariables("--accentColor", hexColor);
      })
      .catch((err) => {
        console.error("Error extracting accent color:", err);
      });
    processImage(imgUrl)
      .then((colors) => {
        setPalette(colors.palette);
        setCSSVariables("--accentColor", colors.accentColor);
        setCSSVariables("--accentHeader", colors.accentColor + "24");
        colors.palette.forEach((color, index) => {
          setCSSVariables(`--palette${index + 1}`, color);
        });
      })
      .catch((err) => {
        console.error("Error processing image:", err);
      });
  }, []);

  useEffect(() => {
    const serverConnect = new ServerConnect();
    serverConnect
      .getUserData()
      .then((res) => {
        setUserData(res);
        serverConnect
          .getMovieData(userData.lastPlayed)
          .then((res) => {
            setMovieData(res);
            setImgUrl(res.backdrop);
          })
          .catch((err) => {
            console.error("Error getting movie data:", err);
          });
      })
      .catch((err) => {
        console.error("Error getting user data:", err);
      });
  }, [userData.lastPlayed, imgUrl]);

  const minsToHours = (min: number): string => {
    const hours = Math.floor(min / 60);
    const mins = min % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-no-padding">
        <div
          className="Header"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <ThemeToggle />
          <h1 id="appTitle" style={{ fontSize: "48px" }}>
            zen
            <span style={{ fontWeight: "bold", fontFamily: "Inter_I" }}>
              Stream
            </span>{" "}
            <span>
              <div
                id="statusDot"
                className={online ? "Online" : "Offline"}
              ></div>
            </span>
          </h1>
        </div>
        <div className="masterContainer" >
          <div
            className="HeroImage"
            style={{ backgroundImage: `url('${imgUrl}')` }}
          ></div>

          <div className="Content" >
            <div className="movieHighlightContainer">
              <div
                className="movieHighlight"
                style={{
                  background: dominantColor + "ed",
                  color: "white",
                  backdropFilter: "blur(10px)",
                }}
              ></div>
              <div id="movieDetailsContainer">
                <h1
                  id="movieTitle"
                  style={{ fontSize: "72px", fontWeight: "bold" }}
                >
                  {movieData.title}{" "}
                </h1>
                <div
                  id="movieSubDetails"
                  style={{ display: "flex", gap: "20px" }}
                >
                  <h3 id="movieYear">{movieData.year}</h3>|
                  <h3 id="movieLanguage">
                    {movieData.language || movieData.original_language}
                  </h3>
                  |<h3 id="movieGenre">{movieData.genres}</h3>|
                  <h3 id="movieDuration">{minsToHours(movieData.runtime)}</h3>
                </div>

                <div className="continueWatching">
                  <h2 style={{ fontWeight: "bold" }}>Continue Watching</h2>
                  <IonIcon icon={play} />
                </div>
              </div>
            </div>
          </div>
          <div className="ContinueContent">
            <div className="ContinueWatchingSection">
              <h2 style={{ fontWeight: "bold", fontSize: "32px" }}>
                Continue Watching
              </h2>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TvDash;
