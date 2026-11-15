import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, messagesOf } from '../api.js';
import { formatDate } from '../format.js';
import Pagination from '../components/Pagination.jsx';
import { ErrorNotice, Notice, Spinner } from '../components/Notice.jsx';

export default function AdminJobs() {
  const [filters, setFilters] = useState({ search: '', status: '', sort: 'newest', page: 1 });
  const [data, setData] = useState({ jobs: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    return api
      .adminJobs({ ...filters, limit: 10 })
      .then((result) => {
        setData(result);
        setErrors([]);
      })
      .catch((err) => setErrors(messagesOf(err)))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const change = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  const changeStatus = async (job, status, text) => {
    try {
      await api.jobStatus(job._id, status);
      setMessage(`"${job.title}" ${text}.`);
      load();
    } catch (err) {
      setErrors(messagesOf(err));
    }
  };

  const remove = async (job) => {
    const sure = window.confirm(
      `Delete "${job.title}" permanently? All ${job.applicationCount} application(s) for this job will also be deleted.`
    );
    if (!sure) return;
    try {
      await api.deleteJob(job._id);
      setMessage(`"${job.title}" was deleted.`);
      load();
    } catch (err) {
      setErrors(messagesOf(err));
    }
  };

  return (
    <>
      <div className="head-row">
        <h1>Manage jobs</h1>
        <Link to="/admin/jobs/new" className="btn primary">Post a new job</Link>
      </div>

      <div className="filters three">
        <input type="search" placeholder="Search title, company or location" value={filters.search} onChange={(e) => change('search', e.target.value)} />
        <select value={filters.status} onChange={(e) => change('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
          <option value="expired">Expired</option>
        </select>
        <select value={filters.sort} onChange={(e) => change('sort', e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title (A to Z)</option>
          <option value="deadline">Deadline</option>
        </select>
      </div>

      <Notice>{message}</Notice>
      <ErrorNotice messages={errors} />

      {loading ? (
        <Spinner />
      ) : data.jobs.length === 0 ? (
        <div className="panel center">No jobs found.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Company</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Applications</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((job) => (
                <tr key={job._id}>
                  <td><strong>{job.title}</strong><br /><small>{job.location}</small></td>
                  <td>{job.company}</td>
                  <td><span className={`pill ${job.state}`}>{job.state}</span></td>
                  <td>{formatDate(job.deadline)}</td>
                  <td><Link to={`/admin/applications?job=${job._id}`}>{job.applicationCount}</Link></td>
                  <td>
                    <div className="row-actions">
                      <Link to={`/admin/jobs/${job._id}/edit`} className="btn ghost small">Edit</Link>
                      {job.status !== 'published' && (
                        <button className="btn ghost small" onClick={() => changeStatus(job, 'published', 'was published')}>Publish</button>
                      )}
                      {job.status === 'published' && (
                        <button className="btn ghost small" onClick={() => changeStatus(job, 'draft', 'was unpublished')}>Unpublish</button>
                      )}
                      {job.status !== 'closed' && (
                        <button className="btn ghost small" onClick={() => changeStatus(job, 'closed', 'was closed')}>Close</button>
                      )}
                      <button className="btn danger small" onClick={() => remove(job)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={filters.page} pages={data.pages} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
    </>
  );
}
