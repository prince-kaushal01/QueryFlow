// TopStats.jsx
import { FaInbox } from "react-icons/fa6";
import { MdOutlineAccessTime } from "react-icons/md";
import { TiTick } from "react-icons/ti";
import { MdErrorOutline } from "react-icons/md";
import { MdPendingActions } from "react-icons/md";
import { MdDoneAll } from "react-icons/md";
import { MdLock } from "react-icons/md";
import { RiTimerFlashLine } from "react-icons/ri";

export default function TopStats({ analytics }) {

  if (!analytics) {
    return (
      <div className="summary-row">
        <div className="card"><p>Loading analytics...</p></div>
      </div>
    );
  }

  const status = analytics.status_counts || {};

  return (
    <div className="summary-row grid grid-cols-4 gap-4">

      {/* Total */}
      <StatCard
        title="Total Queries"
        value={analytics.total_queries}
        icon={<FaInbox size={20} />}
        color="#155DFC"
        bg="#DBEAFE"
      />

      {/* New */}
      <StatCard
        title="New"
        value={status.new || 0}
        icon={<MdOutlineAccessTime size={20} />}
        color="#E17100"
        bg="#FEF3C6"
      />

      {/* In Progress */}
      <StatCard
        title="In Progress"
        value={status.in_progress || 0}
        icon={<TiTick size={20} />}
        color="#5641F7"
        bg="#E0E7FF"
      />

      {/* Pending */}
      <StatCard
        title="Pending"
        value={status.pending || 0}
        icon={<MdPendingActions size={20} />}
        color="#92400E"
        bg="#FEF3C7"
      />

      {/* Answered */}
      <StatCard
        title="Answered"
        value={status.answered || 0}
        icon={<MdDoneAll size={20} />}
        color="#059669"
        bg="#D1FAE5"
      />

      {/* Closed */}
      <StatCard
        title="Closed"
        value={status.closed || 0}
        icon={<MdLock size={20} />}
        color="#4B5563"
        bg="#E5E7EB"
      />

      {/* On Hold */}
      <StatCard
        title="On Hold"
        value={status.onhold || 0}
        icon={<RiTimerFlashLine size={20} />}
        color="#7C3AED"
        bg="#EDE9FE"
      />

      {/* Urgent */}
      <StatCard
        title="Urgent"
        value={analytics.urgent_queries || 0}
        icon={<MdErrorOutline size={20} />}
        color="#E7000B"
        bg="#FFE2E2"
      />

      {/* Average Response Time */}
      {/* <StatCard
        title="Avg Response Time"
        value={analytics.average_response_time || "N/A"}
        icon={<MdOutlineAccessTime size={20} />}
        color="#1E40AF"
        bg="#DBEAFE"
      /> */}

    </div>
  );
}


// =================================
// Reusable Stat Card Component
// =================================
function StatCard({ title, value, icon, color, bg }) {
  return (
    <div className="card flex justify-between items-center">
      <div>
        <p className="card-title">{title}</p>
        <p className="card-value">{value}</p>
      </div>

      <div
        className="h-12 w-12 rounded-2xl flex items-center justify-center"
        style={{ color: color, background: bg }}
      >
        {icon}
      </div>
    </div>
  );
}
