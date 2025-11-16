// useQueries.js
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

/*
  useQueries provides:
  - queries: array
  - loading, error
  - fetchAll(filters,pagination)
  - subscribeRealtime() and unsubscribe()
  - functions to update a record (updateStatus, assign, reply)
*/

export function useQueries({ pageSize = 100 } = {}) {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  // initial fetch
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('queries')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(pageSize);
      if (!mounted) return;
      if (error) setError(error);
      else setQueries(data ?? []);
      setLoading(false);
    }
    load();

    // attempt realtime subscribe (v2 channel). fallback to polling if subscribe fails
    let pollInt = null;
    try {
      const channel = supabase.channel('public:queries');
      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'queries' }, (payload) => {
          setQueries(prev => [payload.new, ...prev]);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'queries' }, (payload) => {
          setQueries(prev => prev.map(q => q.id === payload.new.id ? payload.new : q));
        })
        .subscribe();
      channelRef.current = channel;
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      // fallback: polling every 8s
      pollInt = setInterval(async () => {
        const { data } = await supabase.from('queries').select('*').order('created_at', { ascending: false }).limit(pageSize);
        setQueries(data ?? []);
      }, 8000);
      channelRef.current = { pollInt };
    }

    return () => {
      mounted = false;
      // unsubscribe properly
      if (channelRef.current) {
        try {
          if (channelRef.current.unsubscribe) channelRef.current.unsubscribe();
          else supabase.removeChannel(channelRef.current);
        } catch { /* empty */ }
      }
      if (pollInt) clearInterval(pollInt);
    };
  }, [pageSize]);

  // fetch with optional filters & pagination
  async function fetchFiltered({ status, priority, q, page = 1, limit = 50 } = {}) {
    setLoading(true);
    let builder = supabase.from('queries').select('*');

    if (status) builder = builder.eq('status', status);
    if (priority) builder = builder.eq('priority', priority);
    if (q) {
      // simple ilike search on subject/content
      builder = builder.or(`subject.ilike.%${q}%,content.ilike.%${q}%`);
    }

    const from = (page - 1) * limit;
    const to = page * limit - 1;
    const { data, error } = await builder.order('created_at', { ascending: false }).range(from, to);
    setLoading(false);
    if (error) { setError(error); return null; }
    return data;
  }

  // update status
  async function updateStatus(id, status) {
    const { data, error } = await supabase
      .from('queries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setQueries(prev => prev.map(q => q.id === id ? data : q));
    return data;
  }

  // assign (and append history)
  async function assignTo(id, assigneeName) {
    // fetch current history for safe append
    const { data: current } = await supabase.from('queries').select('history').eq('id', id).single();
    const history = Array.isArray(current.history) ? [...current.history] : [];
    history.push({ timestamp: new Date().toISOString(), action: `Assigned to ${assigneeName}`, user: 'You' });

    const { data, error } = await supabase
      .from('queries')
      .update({ assigned_to: assigneeName, history, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setQueries(prev => prev.map(q => q.id === id ? data : q));
    return data;
  }

  // send reply: append to history and optionally change status
  async function sendReply(id, replyText, resolveAfterReply = false) {
    const { data: cur } = await supabase.from('queries').select('history,status').eq('id', id).single();
    const history = Array.isArray(cur.history) ? [...cur.history] : [];
    history.push({ timestamp: new Date().toISOString(), action: `Replied: ${replyText}`, user: 'You' });

    const newStatus = resolveAfterReply ? 'resolved' : (cur.status === 'new' ? 'in_progress' : cur.status);

    const { data, error } = await supabase
      .from('queries')
      .update({ history, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setQueries(prev => prev.map(q => q.id === id ? data : q));
    return data;
  }

  return {
    queries, loading, error,
    fetchFiltered,
    updateStatus, assignTo, sendReply
  };
}
