// AnalyticsPage.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../quary/Navbar";
import StatCards from "./StatCards";
import ChannelBarChart from "./ChannelBarChart";
import TypePieChart from "./TypePieChart";
import ResponseTrend from "./ResponseTrend";
import PriorityBar from "./PriorityBar";
import TeamPerformance from "./TeamPerformance";

export default function AnalyticsPage({ onSwitchView }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    try {
      const res = await fetch("https://queryflow-xzpm.onrender.com/api/analytics/summary");
      const data = await res.json();
      setAnalytics(data);
      setLoading(false);
    } catch (err) {
      console.error("Analytics load failed:", err);
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div>
        <Navbar onSwitchView={onSwitchView} activeView="analytics" />
        <div className="p-4">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar onSwitchView={onSwitchView} activeView="analytics" />

      {/* Summary Cards */}
      <StatCards summary={analytics} />

      {/* CHART ROW 1 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginTop: 18,
        }}
      >
        <ChannelBarChart chart={analytics.queries_by_channel} />
        <TypePieChart chart={analytics.query_type_distribution} />
      </div>

      {/* CHART ROW 2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginTop: 18,
        }}
      >
        <ResponseTrend chart={analytics.response_time_trend} />
        <PriorityBar chart={analytics.priority_breakdown} />
      </div>

      {/* OPTIONAL TEAM PERFORMANCE */}
      <div style={{ marginTop: 18 }}>
        <TeamPerformance />
      </div>
    </div>
  );
}
