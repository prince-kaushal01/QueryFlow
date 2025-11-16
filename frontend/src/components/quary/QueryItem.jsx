// QueryItem.jsx
import React from 'react';

export default function QueryItem({ item, selected, onSelect }) {
  return (
    <div
      key={item.id}
      className={`item ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
    >
      <div className="item-top">
        <div className="item-subject">{item.subject}</div>
        <div className={`badge ${item.priority}`}>{item.priority}</div>
      </div>
      <div className="item-meta">{item.sender_name} • {item.channel} • {timeAgo(item.created_at)}</div>
      <div className="item-excerpt">{(item.content || '').slice(0, 120)}{item.content?.length > 120 ? '…' : ''}</div>
      <div className="item-tags">{(item.tags || []).slice(0,3).map(t => <span key={t} className="tag">{t}</span>)}</div>
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime())/1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
