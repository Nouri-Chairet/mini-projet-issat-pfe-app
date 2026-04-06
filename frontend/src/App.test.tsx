import { render, screen } from "@testing-library/react";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

test("renders login page", () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
  const title = screen.getByText(/connexion/i);
  expect(title).toBeInTheDocument();
});
