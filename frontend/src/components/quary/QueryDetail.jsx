// src/components/QueryDetail.jsx

import React, { useState, useEffect } from "react";

export default function QueryDetail({ message, onUpdateStatus, onSendReply }) {
  const [replyText, setReplyText] = useState("");
  const [resolveAfterReply, setResolveAfterReply] = useState(false);
  const [history, setHistory] = useState([]);

  // Load full thread when a message is selected
  useEffect(() => {
    async function loadHistory() {
      if (!message?.id) return;

      try {
        const res = await fetch(`http://localhost:8000/api/queries/${message.id}/full`);
        const data = await res.json();

        // Chat history = first message + all replies
        setHistory(data.history || []);
      } catch (err) {
        console.error("Failed to load chat thread:", err);
      }
    }

    setReplyText("");
    setResolveAfterReply(false);
    loadHistory();
  }, [message?.id]);

  if (!message) {
    return (
      <div style={{ padding: 16, background: "#fff", borderRadius: 10 }}>
        Select a query to view details
      </div>
    );
  }

  // SEND REPLY
  async function send() {
    const trimmed = replyText.trim();
    if (!trimmed) return alert("Please write a reply before sending.");

    await onSendReply(message.id, trimmed, resolveAfterReply);

    // Reload chat history from backend after sending reply
    const res = await fetch(`http://localhost:8000/api/queries/${message.id}/full`);
    const data = await res.json();

    setHistory(data.history || []);
    setReplyText("");
    setResolveAfterReply(false);
  }

  return (
    <div style={{ background: "#fff", padding: 18, borderRadius: 10 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0 }}>{message.subject}</h3>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            {(message.sender_name || message.sender?.name) ?? "User"} •{" "}
            {(message.sender_email || message.sender?.email) ?? ""}
          </div>
        </div>

        <div style={{ textAlign: "right", color: "#6b7280" }}>
          <div>Status: <strong>{message.status}</strong></div>
          <div>Priority: <strong>{message.priority}</strong></div>
        </div>
      </div>

      {/* CHAT HISTORY */}
      <div
        style={{
          marginTop: 20,
          maxHeight: "400px",
          overflowY: "auto",
          paddingRight: 10
        }}
      >
        <h4>Conversation</h4>

        {history.length === 0 && (
          <div style={{ color: "#6b7280" }}>No messages yet.</div>
        )}

        {history.map((msg, index) => {
          const isAdmin = msg.sender_type === "admin";

          return (
            <div
              key={index}
              style={{
                margin: "10px 0",
                padding: 12,
                borderRadius: 10,
                maxWidth: "75%",
                background: isAdmin ? "#E8F5E9" : "#F3F4F6",
                alignSelf: isAdmin ? "flex-end" : "flex-start",
                marginLeft: isAdmin ? "auto" : 0
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 5 }}>
                {isAdmin ? "Admin" : (message.sender_name || "User")}
              </div>

              <div>{msg.message}</div>

              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                {new Date(msg.createdAt).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* STATUS BUTTONS */}
      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button
          onClick={() => onUpdateStatus(message.id, "in_progress")}
          style={{ ...btnStyle, background: "#10b981", color: "#fff" }}
        >
          Mark In Progress
        </button>

        <button
          onClick={() => onUpdateStatus(message.id, "closed")}
          style={{ ...btnStyle, background: "#ef4444", color: "#fff" }}
        >
          Close
        </button>
      </div>

      {/* REPLY BOX */}
      <div style={{ marginTop: 18 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Reply</label>

        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write your reply..."
          style={{
            width: "100%",
            minHeight: 110,
            borderRadius: 8,
            padding: 10,
            border: "1px solid #e6e9ee"
          }}
        />

        <div
          style={{
            marginTop: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={resolveAfterReply}
              onChange={(e) => setResolveAfterReply(e.target.checked)}
            />
            <span style={{ color: "#6b7280" }}>Resolve after reply</span>
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setReplyText("");
                setResolveAfterReply(false);
              }}
              style={btnStyle}
            >
              Clear
            </button>

            <button
              onClick={send}
              style={{ ...btnStyle, background: "#10b981", color: "#fff" }}
            >
              Send Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #e6e9ee",
  background: "#fff",
  cursor: "pointer"
};
