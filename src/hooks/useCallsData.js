import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { mapRow } from "../lib/data.js";

export function useCallsData() {
  const [calls,       setCalls]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    async function fetchCalls() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("calls")
        .select("*")
        .order("date", { ascending: false })
        .limit(600);

      if (cancelled) return;
      if (err) { setError(err.message); setLoading(false); return; }

      const mapped = (data || []).map(mapRow);
      setCalls(mapped);
      setLoading(false);
    }
    fetchCalls();
    return () => { cancelled = true; };
  }, [lastRefresh]);

  // Subscribe to realtime inserts
  useEffect(() => {
    const channel = supabase
      .channel("calls-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "calls" }, () => {
        setLastRefresh(Date.now());
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const refresh = () => setLastRefresh(Date.now());
  return { calls, loading, error, refresh };
}
