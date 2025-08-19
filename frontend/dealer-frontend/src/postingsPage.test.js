import { render, screen } from "@testing-library/react";
import PostingsPage from "./PostingsPage";

test("renders service posts heading", () => {
  render(<PostingsPage />);
  expect(screen.getByText(/Your Service Posts/i)).toBeInTheDocument();
});
