// Navbar.jsx
import { FiMessageSquare } from "react-icons/fi";
import { TbBrandGoogleAnalytics } from "react-icons/tb";

export default function Navbar({ onSwitchView = () => {}, activeView = 'inbox' }) {
  return (
    <header className="flex justify-between items-center h-20 w-full px-5 py-2 sticky top-0 bg-white">
      <div className="flex items-center gap-3">
        <div className="logo"><FiMessageSquare size={25} /></div>
        <div>
          <div className="title">Audience Query Hub</div>
          <div className="subtitle">Unified customer communication platform</div>
        </div>
      </div>

      <nav className="flex gap-2">
        <button
          className={`nav-btn ${activeView === 'inbox' ? 'active' : ''} flex items-center justify-center gap-1 px-5 py-2`}
          onClick={() => onSwitchView('inbox')}
        >
          <FiMessageSquare className="mt-0.5" />
          Inbox
        </button>

        <button
          className={`nav-btn ${activeView === 'analytics' ? 'active' : ''} flex items-center justify-center gap-1 px-5 py-2`}
          onClick={() => onSwitchView('analytics')}
        >
          <TbBrandGoogleAnalytics />
          Analytics
        </button>
      </nav>
    </header>
  );
}
