import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter } from "react-router-dom";
import Application from "./application";

it("renders without crashing", async () => {
  const div = document.createElement("div");
  ReactDOM.render(
    <MemoryRouter>
      <Application />
    </MemoryRouter>,
    div
  );
  await new Promise(resolve => setTimeout(resolve, 1000));
});
