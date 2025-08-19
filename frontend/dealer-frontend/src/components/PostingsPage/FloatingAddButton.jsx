import React from "react";

const FloatingAddButton = () => {
  const handleClick = () => {
    const formSection = document.getElementById("postFormSection");
    if (formSection) {
      formSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <button
      className="btn btn-primary d-md-none"
      title="Add New Post"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        borderRadius: "50%",
        width: "56px",
        height: "56px",
        boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
        zIndex: 1000,
        fontSize: "24px",
        padding: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={handleClick}
    >
      +
    </button>
  );
};

export default FloatingAddButton;
