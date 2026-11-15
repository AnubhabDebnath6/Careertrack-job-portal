import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, messagesOf } from '../api.js';
import { APPLICATION_STATUSES } from '../format.js';
import { ErrorNotice, Spinner } from '../components/Notice.jsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    api
      .stats()
      .then((data) => setStats(data.stats))
      .catch((err) => setErrors(messagesOf(err)));
  }, []);

  if (errors.length) return <ErrorNotice messages={errors} />;
  if (!stats) return <Spinner />;

  const cards = [
    ['Total jobs', stats.totalJobs, 'blue'],
    ['Active jobs', stats.activeJobs, 'green'],
    ['Closed or expired', stats.closedOrExpired, 'red'],
    ['Total applications', stats.totalApplications, 'amber']
  ];

  return (
    <>
      <h1>Dashboard</h1>
      <div className="stats">
        {cards.map(([label, value, color]) => (
          <div className={`stat ${color}`} key={label}>
            <span>{value}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Applications by status</h2>
        <div className="status-list">
          {APPLICATION_STATUSES.map((status) => (
            <div key={status}>
              <strong>{stats.applicationsByStatus[status] || 0}</strong>
              <span>{status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="actions">
        <Link to="/admin/jobs/new" className="btn primary">Post a new job</Link>
        <Link to="/admin/jobs" className="btn ghost">Manage jobs</Link>
        <Link to="/admin/applications" className="btn ghost">Review applications</Link>
      </div>
    </>
  );
}
