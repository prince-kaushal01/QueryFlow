// src/pages/InboxPage.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import TopStats from '../components/quary/TopStats';
import SearchBar from '../components/quary/SearchBar';
import QueryList from '../components/quary/QueryList';
import QueryDetail from '../components/quary/QueryDetail';
import Navbar from '../components/quary/Navbar';

export default function InboxPage() {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [analytics, setAnalytics] = useState(null);   // ✅ NEW
  const pageSize = 200;

  // ============================
  // 1) LOAD BACKEND ANALYTICS FIRST
  // ============================
  async function loadAnalytics() {
    try {
      const res = await fetch("http://localhost:8000/analytics/summary");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Analytics load error:", err);
    }
  }

  // ============================
  // 2) LOAD SUPABASE QUERIES
  // ============================
  async function loadSupabaseQueries(mounted) {
    const { data, error } = await supabase
      .from('queries')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(pageSize);

    if (!mounted) return;

    if (error) {
      console.error(error);
      setMessages([]);
    } else {
      setMessages(data || []);
      setSelected(data?.[0] ?? null);
    }
  }

  // ============================
  // 3) PAGE LOADING EFFECT
  // ============================
  useEffect(() => {
    let mounted = true;

    // First: Load backend analytics
    loadAnalytics();

    // Then: Load Supabase messages
    loadSupabaseQueries(mounted);

    // ========== SUBSCRIBE TO REALTIME CHANGES ==========
    const channel = supabase.channel('public:queries');

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'queries' }, (payload) => {
        setMessages(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'queries' }, (payload) => {
        setMessages(prev => prev.map(m => (m.id === payload.new.id ? payload.new : m)));
        setSelected(prev => (prev && prev.id === payload.new.id ? payload.new : prev));
      })
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(channel); } catch (e) {}
    };
  }, []);

  // ============================
  // SEARCH FILTER
  // ============================
  const filtered = messages.filter(m => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (m.subject || '').toLowerCase().includes(s)
      || (m.content || '').toLowerCase().includes(s)
      || (m.sender_name || '').toLowerCase().includes(s);
  });

  // ============================
  // ACTION HANDLERS (unchanged)
  // ============================

  async function handleUpdateStatus(id, status) {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, status } : m)));
    if (selected?.id === id) setSelected(prev => (prev ? { ...prev, status } : prev));

    const { data, error } = await supabase
      .from('queries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('updateStatus error', error);
      const { data: fresh } = await supabase.from('queries').select('*').eq('id', id).single();
      setMessages(prev => prev.map(m => (m.id === id ? fresh : m)));
      if (selected?.id === id) setSelected(fresh);
      return null;
    }
    return data;
  }

  async function handleAssign(id, assigneeName = 'Support Team') {
    const { data: cur } = await supabase.from('queries').select('history').eq('id', id).single();
    const history = Array.isArray(cur.history) ? [...cur.history] : [];
    history.push({ timestamp: new Date().toISOString(), action: `Assigned to ${assigneeName}`, user: 'You' });

    const { data } = await supabase
      .from('queries')
      .update({ assigned_to: assigneeName, history, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    setMessages(prev => prev.map(m => m.id === id ? data : m));
    if (selected?.id === id) setSelected(data);
    return data;
  }

  async function handleSendReply(id, replyText, resolveAfterReply = false) {
    if (!replyText.trim()) return;

    const { data: cur } = await supabase.from('queries').select('history,status').eq('id', id).single();
    const history = Array.isArray(cur.history) ? [...cur.history] : [];

    history.push({
      timestamp: new Date().toISOString(),
      action: `Replied: ${replyText}`,
      user: 'You'
    });

    const newStatus = resolveAfterReply ? 'resolved' : (cur.status === 'new' ? 'in_progress' : cur.status);

    const { data } = await supabase
      .from('queries')
      .update({ history, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    setMessages(prev => prev.map(m => (m.id === id ? data : m)));
    if (selected?.id === id) setSelected(data);
  }

  return (
    <div>
      <div className='mb-3 sticky top-0'>
        <Navbar />
      </div>

      {/* pass analytics from backend */}
      <TopStats analytics={analytics} messages={messages} />

      <SearchBar search={search} setSearch={setSearch} />

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, marginTop: 12 }}>
        <div>
          <QueryList messages={filtered} selectedId={selected?.id} onSelect={setSelected} />
        </div>

        <div>
          <QueryDetail
            message={selected}
            onAssign={handleAssign}
            onUpdateStatus={handleUpdateStatus}
            onSendReply={handleSendReply}
          />
        </div>
      </div>
    </div>
  );
}
