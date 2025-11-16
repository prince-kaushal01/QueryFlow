// TeamPerformance.jsx
// Simple table showing mock team performance metrics.
// In real app compute from assignments/resolutions data.
import React from 'react';

const mockTeam = [
  { name: 'Alex Kim', assigned: 2, resolved: 0, avgResponse: '0.9h', rate: '85%' },
  { name: 'Jamie Lee', assigned: 2, resolved: 2, avgResponse: '0.6h', rate: '92%' },
  { name: 'Taylor Brown', assigned: 2, resolved: 0, avgResponse: '1.5h', rate: '78%' },
  { name: 'Sam Wilson', assigned: 1, resolved: 0, avgResponse: '1.0h', rate: '88%' }
];

export default function TeamPerformance() {
  return (
    <div style={{ background:'#fff', borderRadius:10, padding:16, boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
      <h4>Team Performance</h4>
      <table style={{ width:'100%', borderCollapse:'collapse', marginTop:12 }}>
        <thead style={{ textAlign:'left', color:'#374151', fontSize:13 }}>
          <tr>
            <th style={th}>Team Member</th>
            <th style={th}>Assigned</th>
            <th style={th}>Resolved</th>
            <th style={th}>Avg Response Time</th>
            <th style={th}>Resolution Rate</th>
          </tr>
        </thead>
        <tbody>
          {mockTeam.map((t, i) => (
            <tr key={i} style={{ borderTop: '1px solid #eef2f7' }}>
              <td style={td}>{t.name}</td>
              <td style={td}>{t.assigned}</td>
              <td style={td}>{t.resolved}</td>
              <td style={td}>{t.avgResponse}</td>
              <td style={{ ...td, color: t.rate.startsWith('8') ? '#10b981' : '#f59e0b' }}>{t.rate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { padding: '12px 8px', fontWeight:700 };
const td = { padding: '12px 8px', color:'#374151' };
