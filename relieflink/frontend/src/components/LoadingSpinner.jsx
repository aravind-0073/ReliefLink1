import React from "react";

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem", color: "#94a3b8" }}>
      <div className="spinner" />
      <p style={{ marginTop: 12, fontSize: 13 }}>{message}</p>
    </div>
  );
}
