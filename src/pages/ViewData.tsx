import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Link } from "react-router-dom";

export default function ViewData() {
  // useQuery automatically subscribes to real-time updates
  // When data changes in Convex, this component will re-render automatically
  const messages = useQuery(api.functions.listMessages);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>View Data</h1>
        <Link
          to="/update"
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Update Data
        </Link>
      </header>

      <section>
        <h2>Real-Time Data</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          This page automatically updates when data changes. Open this page in another browser
          and use the Update Data page to see real-time synchronization in action.
        </p>

        {messages === undefined ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            Loading data...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
            <p style={{ marginBottom: "10px" }}>No messages yet.</p>
            <Link to="/update" style={{ color: "#007bff" }}>Create the first message</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {messages.map((message) => (
              <article
                key={message._id}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "20px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong style={{ fontSize: "1.1em" }}>{message.author}</strong>
                  <time style={{ color: "#666", fontSize: "0.9em" }}>
                    {new Date(message.createdAt).toLocaleString()}
                  </time>
                </div>
                <p style={{ margin: 0, lineHeight: "1.5" }}>{message.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e0e0e0", color: "#666", fontSize: "0.9em" }}>
        <p>Powered by Convex real-time database</p>
      </footer>
    </div>
  );
}
