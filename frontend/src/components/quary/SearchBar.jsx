// SearchBar.jsx

export default function SearchBar({ search, setSearch }) {
  return (
    <div className="controls">
      <input
        placeholder="Search queries..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="search"
      />
    </div>
  );
}
