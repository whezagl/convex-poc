import { useState, FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Link } from "react-router-dom";
import { Id } from "../convex/_generated/dataModel";

interface MessageForm {
  author: string;
  body: string;
}

export default function UpdateData() {
  const createMessage = useMutation(api.functions.createMessage);
  const updateMessage = useMutation(api.functions.updateMessage);
  const deleteMessage = useMutation(api.functions.deleteMessage);
  const messages = useQuery(api.functions.listMessages);

  const [formData, setFormData] = useState<MessageForm>({ author: "", body: "" });
  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);
  const [editForm, setEditForm] = useState<MessageForm>({ author: "", body: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.author.trim() || !formData.body.trim()) {
      setError("Author and message body are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createMessage({
        author: formData.author.trim(),
        body: formData.body.trim(),
      });
      setFormData({ author: "", body: "" });
    } catch (err) {
      setError("Failed to create message. Please try again.");
      console.error("Error creating message:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (id: Id<"messages">, author: string, body: string) => {
    setEditingId(id);
    setEditForm({ author, body });
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ author: "", body: "" });
    setError(null);
  };

  const handleUpdateSubmit = async (e: FormEvent, id: Id<"messages">) => {
    e.preventDefault();
    if (!editForm.author.trim() || !editForm.body.trim()) {
      setError("Author and message body are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateMessage({
        id,
        author: editForm.author.trim(),
        body: editForm.body.trim(),
      });
      setEditingId(null);
      setEditForm({ author: "", body: "" });
    } catch (err) {
      setError("Failed to update message. Please try again.");
      console.error("Error updating message:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"messages">) => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    setError(null);

    try {
      await deleteMessage({ id });
    } catch (err) {
      setError("Failed to delete message. Please try again.");
      console.error("Error deleting message:", err);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>Update Data</h1>
        <Link
          to="/"
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          View Data
        </Link>
      </header>

      {error && (
        <div
          style={{
            padding: "15px",
            marginBottom: "20px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      <section style={{ marginBottom: "40px" }}>
        <h2>Create New Message</h2>
        <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label
              htmlFor="author"
              style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}
            >
              Author:
            </label>
            <input
              id="author"
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "1em",
              }}
              placeholder="Enter author name"
            />
          </div>

          <div>
            <label
              htmlFor="body"
              style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}
            >
              Message:
            </label>
            <textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              disabled={isSubmitting}
              rows={4}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "1em",
                resize: "vertical",
              }}
              placeholder="Enter message content"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "10px 20px",
              backgroundColor: isSubmitting ? "#6c757d" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1em",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              alignSelf: "flex-start",
            }}
          >
            {isSubmitting ? "Creating..." : "Create Message"}
          </button>
        </form>
      </section>

      <section>
        <h2>Existing Messages</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Edit or delete existing messages. Changes will immediately reflect on the View Data page.
        </p>

        {messages === undefined ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
            <p>No messages yet. Create the first message above.</p>
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
                {editingId === message._id ? (
                  <form
                    onSubmit={(e) => handleUpdateSubmit(e, message._id)}
                    style={{ display: "flex", flexDirection: "column", gap: "10px" }}
                  >
                    <div>
                      <label
                        htmlFor={`edit-author-${message._id}`}
                        style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "0.9em" }}
                      >
                        Author:
                      </label>
                      <input
                        id={`edit-author-${message._id}`}
                        type="text"
                        value={editForm.author}
                        onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                        disabled={isSubmitting}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ced4da",
                          borderRadius: "4px",
                          fontSize: "1em",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`edit-body-${message._id}`}
                        style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "0.9em" }}
                      >
                        Message:
                      </label>
                      <textarea
                        id={`edit-body-${message._id}`}
                        value={editForm.body}
                        onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                        disabled={isSubmitting}
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ced4da",
                          borderRadius: "4px",
                          fontSize: "1em",
                          resize: "vertical",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: isSubmitting ? "#6c757d" : "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: isSubmitting ? "not-allowed" : "pointer",
                        }}
                      >
                        {isSubmitting ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: isSubmitting ? "not-allowed" : "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <strong style={{ fontSize: "1.1em" }}>{message.author}</strong>
                      <time style={{ color: "#666", fontSize: "0.9em" }}>
                        {new Date(message.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <p style={{ margin: "0 0 15px 0", lineHeight: "1.5" }}>{message.body}</p>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => handleEdit(message._id, message.author, message.body)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.9em",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(message._id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.9em",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
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
