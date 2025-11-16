// QueryList.jsx
import React from 'react';
import QueryItem from './QueryItem';

export default function QueryList({ messages, selectedId, onSelect }) {
  return (
    <div className="list">
      {messages.map(m => (
        <QueryItem key={m.id} item={m} selected={selectedId === m.id} onSelect={onSelect} />
      ))}
    </div>
  );
}
