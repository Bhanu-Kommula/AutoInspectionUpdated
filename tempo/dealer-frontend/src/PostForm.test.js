import { render, screen } from "@testing-library/react";
import PostForm from "./PostForm";

test("renders post form", () => {
  render(
    <PostForm
      post={{ content: "", location: "", offerAmount: "" }}
      setPost={() => {}}
      selectedCity={null}
      setSelectedCity={() => {}}
      cityOptions={[]}
      iconIndex={0}
      postIcons={[]}
      onPostSubmit={() => {}}
    />
  );
  expect(screen.getByText(/description/i)).toBeInTheDocument();
});
