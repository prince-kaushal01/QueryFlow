// ChannelBarChart.jsx
import React from "react";
import Plot from "react-plotly.js";

export default function ChannelBarChart({ chart }) {
  if (!chart) {
    return (
      <div style={cardStyle}>
        <h4>Queries by Channel</h4>
        <p>Loading chart...</p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h4>Queries by Channel</h4>
      <Plot
        data={chart.data}
        layout={{
          ...chart.layout,
          autosize: true,
          height: 260,
          margin: { t: 40, l: 40, r: 20, b: 40 }
        }}
        config={{ displayModeBar: false }}
        style={{ width: "100%" }}
      />
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  padding: 16,
  borderRadius: 10,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};
