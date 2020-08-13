import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import Application from "./application";
//import registerServiceWorker from './registerServiceWorker';
import { configure } from "mobx";

configure({ enforceActions: "observed" });

const baseUrl = document.getElementsByTagName("base")[0].getAttribute("href");
const rootElement = document.getElementById("root");

ReactDOM.render(
    <BrowserRouter basename={baseUrl || undefined}>
        <Application />
    </BrowserRouter>,
    rootElement
);

// Uncomment the line above that imports the registerServiceWorker function
// and the line below to register the generated service worker.
// By default create-react-app includes a service worker to improve the
// performance of the application by caching static assets. This service
// worker can interfere with the Identity UI, so it is
// disabled by default when Identity is being used.
//
//registerServiceWorker();
