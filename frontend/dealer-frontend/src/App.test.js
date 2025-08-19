import { render, screen } from "@testing-library/react";
import App from "./App";
import PostingsPage from "./PostingsPage";

test("renders learn react link", () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

test("renders service posts heading", () => {
  render(<PostingsPage />);
  expect(screen.getByText(/Your Service Posts/i)).toBeInTheDocument();
});
