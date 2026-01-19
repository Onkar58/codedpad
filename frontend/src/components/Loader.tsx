export const Loader = () => {
  // Inline styles for the loader animation
  const loaderStyles = {
    display: "inline-block",
    border: "6px solid #f3f3f3",
    borderTop: "6px solid #3498db",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
  };

  // Inline styles for the container of the loader
  const containerStyles = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
  };

  // Injecting the CSS animation in JavaScript dynamically
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;
  document.head.appendChild(styleTag);

  return (
    <div style={containerStyles}>
      <div style={loaderStyles}></div>
    </div>
  );
};
