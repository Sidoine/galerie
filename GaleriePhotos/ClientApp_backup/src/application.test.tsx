import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Application from "./application";

it("renders without crashing", async () => {
    const div = document.createElement("div");
    const root = createRoot(div);
    root.render(
        <MemoryRouter>
            <Application />
        </MemoryRouter>
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
});
