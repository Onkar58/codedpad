import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Home() {
  const [value, setValue] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!value.trim()) return;
    navigate(`/${encodeURIComponent(value)}`);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
      }}
    >
      <h1>Homepage</h1>

      <input
        type="text"
        placeholder="Enter any string..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          padding: "10px",
          width: "260px",
          textAlign: "center",
          borderRadius: "8px",
          border: "1px solid #ccc",
          fontSize: "16px",
        }}
      />

      <button
        onClick={handleSubmit}
        style={{
          padding: "8px 16px",
          borderRadius: "8px",
          border: "none",
          background: "#0070f3",
          color: "white",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Go
      </button>
    </div>
  );
}
