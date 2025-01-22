import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Application from "./application";
//import registerServiceWorker from './registerServiceWorker';

// configure({
//     enforceActions: "observed",
//     computedRequiresReaction: true,
//     observableRequiresReaction: true,
//     reactionRequiresObservable: true,
// });

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
root.render(
    <BrowserRouter basename="/">
        <Application />
    </BrowserRouter>
);

// Uncomment the line above that imports the registerServiceWorker function
// and the line below to register the generated service worker.
// By default create-react-app includes a service worker to improve the
// performance of the application by caching static assets. This service
// worker can interfere with the Identity UI, so it is
// disabled by default when Identity is being used.
//
//registerServiceWorker();
