/* eslint-disable no-unused-vars */
// src/pages/InboxPage.jsx
import React, { useEffect, useState } from "react";
import TopStats from "../components/quary/TopStats";
import SearchBar from "../components/quary/SearchBar";
import QueryList from "../components/quary/QueryList";
import QueryDetail from "../components/quary/QueryDetail";
import Navbar from "../components/quary/Navbar";

export default function InboxPage({ onSwitchView }) {   // CORRECT {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [analytics, setAnalytics] = useState(null);

  // ============================
  // LOAD EVERYTHING FROM BACKEND
  // ============================
  async function loadBackend() {
    try {
      const res = await fetch("https://queryflow-xzpm.onrender.com/api/queries/summary");
      const data = await res.json();

      console.log("BACKEND RESPONSE => ", data);

      // Backend returns full query list
      const queries = data.queries || [];

      setMessages(queries);
      setSelected(queries[0] || null);

      // Set analytics
      setAnalytics({
        total_queries: data.total_queries,
        new_queries: data.new_queries,
        in_progress_queries: data.in_progress_queries,
        urgent_queries: data.urgent_queries,
        status_counts: data.status_counts,
        // average_response_time: data.average_response_time,
      });
    } catch (err) {
      console.error("Backend error:", err);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBackend();
  }, []);

  // ============================
  // SEARCH
  // ============================
  const filtered = messages.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (m.subject || "").toLowerCase().includes(s) ||
      (m.content || "").toLowerCase().includes(s) ||
      (m.sender?.name || "").toLowerCase().includes(s)
    );
  });

  // ============================
  // UPDATE STATUS (Backend)
  // ============================
  async function handleUpdateStatus(id, status) {
    try {
      const res = await fetch("https://queryflow-xzpm.onrender.com/api/queries/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const returned = await res.json();

      // Update FE instantly
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );

      if (selected?.id === id) {
        setSelected((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  }

  // ============================
  // SEND REPLY (Backend)
  // ============================
  async function handleSendReply(id, replyText, resolveAfterReply = false) {
    if (!replyText.trim()) return;

    try {
      const res = await fetch("https://queryflow-xzpm.onrender.com/api/queries/send-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          reply: replyText,
          resolve_after_reply: resolveAfterReply,
        }),
      });

      const returned = await res.json();
      const updatedMessage = returned.updated?.[0];

      if (!updatedMessage) return;

      // Update UI instantly
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? updatedMessage : m))
      );
      if (selected?.id === id) setSelected(updatedMessage);
    } catch (err) {
      console.error("Reply error:", err);
    }
  }
  // ---------- end actions ----------

  return (
    <div>
      <div className='mb-3 sticky top-0'>
      <Navbar onSwitchView={onSwitchView} activeView="inbox" />

      </div>
      <TopStats analytics={analytics} />
      <SearchBar search={search} setSearch={setSearch} />

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, marginTop: 12 }}>
        <div>
          <QueryList messages={filtered} selectedId={selected?.id} onSelect={setSelected} />
        </div>

        <div>
          <QueryDetail
            message={selected}
            // eslint-disable-next-line no-undef
            onAssign={(id,team) => handleAssign(id, team)}
            onUpdateStatus={(id,status) => handleUpdateStatus(id,status)}
            onSendReply={(id, text, resolve) => handleSendReply(id, text, resolve)}
          />
        </div>
      </div>
    </div>
  );
}
