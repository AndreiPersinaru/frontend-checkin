import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Setează locale-ul browserului la românesc pentru a obține format 24h
if (navigator.language !== "ro" && navigator.language !== "ro-RO") {
    try {
        window.navigator.language = "ro-RO";
    } catch (e) {
        // Unele browsere nu permit schimbarea linguii
    }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
