import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Application from "./application";

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
root.render(
    <BrowserRouter basename="/">
        <Application />
    </BrowserRouter>
);
