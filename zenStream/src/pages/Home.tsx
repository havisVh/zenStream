import "./Home.css";
import "../master.css";
import ServerConnect from "../lib/ServerConnect.ts";
import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

const Home: React.FC = () => {
  const history = useHistory();
  const [status, setStatus] = useState("Loading...");
  const [online, setOnline] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState("Indexing Files in the server");
  
  useEffect(() => {
    const serverConnect = new ServerConnect();
    const pingRequest = serverConnect
      .ping()
      .then((res) => {
        if (res === "pong") {
          setStatus("Online");
          setOnline(true);
        } else {
          setStatus(res);
          setOnline(false);
        }
      })
      .catch((err) => {
        console.error("Error pinging server:", err);
        setStatus("Error pinging server");
      });

    const indexingRequest = serverConnect
      .triggerIndexing()
      .then((res) => {
        if (res === "Indexing Complete") {
          setIndexingStatus("Indexing Complete");
        }
      })
      .catch((err) => {
        console.error("Error triggering indexing:", err);
        setIndexingStatus("Error triggering indexing");
      });

    const userDataRequest = serverConnect
      .getUserData()
      .then((res) => {
        console.log("User Data:", res);
      })
      .catch((err) => {
        console.error("Error getting user data:", err);
      });

    Promise.allSettled([pingRequest, indexingRequest, userDataRequest]).finally(() => {
      history.replace("/home");
    });
  }, [history]);

  return (
    <>
      <div className="masterContainer">
        <h2 className="UpperTitle">Welcome To</h2>
        <h1 style={{ fontSize: "48px" }}>
          zen
          <span style={{ fontWeight: "bold", fontFamily: "Inter_I" }}>
            Stream
          </span>
        </h1>

        <div className="statusIndicator">
          <h3 className="LowerTitle">
            Status:{" "}
            <span className={online ? "Online" : "Offline"}>{status}</span>
          </h3>
          <h3 className="LowerTitle">
           {indexingStatus}
          </h3>
        </div>
      </div>
    </>
  );
};

export default Home;
