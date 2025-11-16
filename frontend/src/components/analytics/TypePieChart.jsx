// TypePieChart.jsx
import React from "react";
import Plot from "react-plotly.js";

export default function TypePieChart({ chart }) {
  if (!chart) {
    return (
      <div style={cardStyle}>
        <h4>Query Types Distribution</h4>
        <p>Loading chart...</p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h4>Query Types Distribution</h4>

      <Plot
        data={chart.data}
        layout={{
          ...chart.layout,
          autosize: true,
          height: 240,
          margin: { t: 30, l: 20, r: 20, b: 20 }
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
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
};
