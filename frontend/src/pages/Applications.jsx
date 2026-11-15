import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, download, messagesOf } from '../api.js';
import { APPLICATION_STATUSES, formatDate } from '../format.js';
import Pagination from '../components/Pagination.jsx';
import { ErrorNotice, Notice, Spinner } from '../components/Notice.jsx';

export default function Applications() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    job: searchParams.get('job') || '',
    status: '',
    from: '',
    to: '',
    search: '',
    page: 1
  });
  const [jobs, setJobs] = useState([]);
  const [data, setData] = useState({ applications: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api
      .adminJobs({ limit: 100, sort: 'title' })
      .then((result) => setJobs(result.jobs))
      .catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .applications({ ...filters, limit: 10 })
        .then((result) => {
          if (!alive) return;
          setData(result);
          setErrors([]);
        })
        .catch((err) => alive && setErrors(messagesOf(err)))
        .finally(() => alive && setLoading(false));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [filters]);

  const change = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  const exportCsv = async () => {
    try {
      const { page, ...rest } = filters;
      await download(api.exportPath(rest), 'applications.csv');
      setMessage('CSV export downloaded.');
    } catch (err) {
      setErrors(messagesOf(err));
    }
  };

  return (
    <>
      <div className="head-row">
        <h1>Applications</h1>
        <button className="btn primary" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="filters four">
        <input type="search" placeholder="Search name or email" value={filters.search} onChange={(e) => change('search', e.target.value)} />
        <select value={filters.job} onChange={(e) => change('job', e.target.value)}>
          <option value="">All jobs</option>
          {jobs.map((job) => (
            <option key={job._id} value={job._id}>{job.title} - {job.company}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => change('status', e.target.value)}>
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}
        </select>
        <label className="date-filter">From <input type="date" value={filters.from} onChange={(e) => change('from', e.target.value)} /></label>
        <label className="date-filter">To <input type="date" value={filters.to} onChange={(e) => change('to', e.target.value)} /></label>
      </div>

      <Notice>{message}</Notice>
      <ErrorNotice messages={errors} />

      {loading ? (
        <Spinner />
      ) : data.applications.length === 0 ? (
        <div className="panel center">No applications found.</div>
      ) : (
        <>
          <p className="muted">{data.total} application{data.total === 1 ? '' : 's'}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Applied on</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.applications.map((item) => (
                  <tr key={item._id}>
                    <td><strong>{item.name}</strong><br /><small>{item.email}</small></td>
                    <td>{item.job ? `${item.job.title} - ${item.job.company}` : 'Deleted job'}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td><span className="pill status">{item.status}</span></td>
                    <td><Link to={`/admin/applications/${item._id}`} className="btn ghost small">Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Pagination page={filters.page} pages={data.pages} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
    </>
  );
}
