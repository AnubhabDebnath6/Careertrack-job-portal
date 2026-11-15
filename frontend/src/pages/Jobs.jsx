import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, messagesOf } from '../api.js';
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, formatSalary, formatDate } from '../format.js';
import Pagination from '../components/Pagination.jsx';
import { ErrorNotice, Spinner } from '../components/Notice.jsx';

const initialFilters = { search: '', location: '', type: '', level: '', sort: 'newest', page: 1 };

export default function Jobs() {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState({ jobs: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .jobs({ ...filters, limit: 9 })
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
  const goToPage = (page) => {
    setFilters((current) => ({ ...current, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <section className="hero">
        <h1>Find your next opportunity</h1>
        <p>Browse open positions and apply in minutes. No account required.</p>
      </section>

      <div className="filters">
        <input
          type="search"
          placeholder="Search by title or company"
          value={filters.search}
          onChange={(e) => change('search', e.target.value)}
        />
        <input
          type="text"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => change('location', e.target.value)}
        />
        <select value={filters.type} onChange={(e) => change('type', e.target.value)}>
          <option value="">All job types</option>
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
        <select value={filters.level} onChange={(e) => change('level', e.target.value)}>
          <option value="">All experience levels</option>
          {EXPERIENCE_LEVELS.map((level) => (
            <option key={level}>{level}</option>
          ))}
        </select>
        <select value={filters.sort} onChange={(e) => change('sort', e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="salary">Highest salary</option>
          <option value="deadline">Closing soon</option>
          <option value="title">Title (A to Z)</option>
        </select>
        <button className="btn ghost" onClick={() => setFilters(initialFilters)}>Reset</button>
      </div>

      <ErrorNotice messages={errors} />

      {loading ? (
        <Spinner label="Loading jobs..." />
      ) : data.jobs.length === 0 ? (
        <div className="panel center">No jobs match your search. Try changing the filters.</div>
      ) : (
        <>
          <p className="muted">{data.total} job{data.total === 1 ? '' : 's'} found</p>
          <div className="grid">
            {data.jobs.map((job) => (
              <article className="card" key={job._id}>
                <h3>{job.title}</h3>
                <p className="company">{job.company}</p>
                <div className="tags">
                  <span className="tag">{job.location}</span>
                  <span className="tag">{job.employmentType}</span>
                  <span className="tag">{job.experienceLevel}</span>
                </div>
                <p className="snippet">{job.description}</p>
                <p className="salary">{formatSalary(job)}</p>
                <div className="card-foot">
                  <small>
                    Posted {formatDate(job.createdAt)}
                    {job.deadline ? ` · Apply by ${formatDate(job.deadline)}` : ''}
                  </small>
                  <Link to={`/jobs/${job._id}`} className="btn primary small">View details</Link>
                </div>
              </article>
            ))}
          </div>
          <Pagination page={filters.page} pages={data.pages} onChange={goToPage} />
        </>
      )}
    </>
  );
}
