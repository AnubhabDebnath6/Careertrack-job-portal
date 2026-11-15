import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, messagesOf } from '../api.js';
import { formatSalary, formatDate } from '../format.js';
import { ErrorNotice, Spinner } from '../components/Notice.jsx';

function Section({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="section">
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    setLoading(true);
    api
      .job(id)
      .then((data) => setJob(data.job))
      .catch((err) => setErrors(messagesOf(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner label="Loading job..." />;

  if (!job) {
    return (
      <div className="panel">
        <ErrorNotice messages={errors} />
        <Link to="/" className="btn ghost">Back to all jobs</Link>
      </div>
    );
  }

  return (
    <div className="panel detail">
      <Link to="/" className="back">&larr; All jobs</Link>
      <h1>{job.title}</h1>
      <p className="company">{job.company}</p>

      <div className="info-grid">
        <div><small>Location</small><strong>{job.location}</strong></div>
        <div><small>Employment type</small><strong>{job.employmentType}</strong></div>
        <div><small>Experience</small><strong>{job.experienceLevel}</strong></div>
        <div><small>Salary</small><strong>{formatSalary(job)}</strong></div>
        <div><small>Posted on</small><strong>{formatDate(job.createdAt)}</strong></div>
        <div><small>Apply before</small><strong>{job.deadline ? formatDate(job.deadline) : 'Open until filled'}</strong></div>
      </div>

      <section className="section">
        <h3>About the role</h3>
        <p className="pre">{job.description}</p>
      </section>

      <Section title="Responsibilities" items={job.responsibilities} />
      <Section title="Qualifications" items={job.qualifications} />

      {job.skills.length > 0 && (
        <section className="section">
          <h3>Required skills</h3>
          <div className="tags">
            {job.skills.map((skill, index) => (
              <span className="tag" key={index}>{skill}</span>
            ))}
          </div>
        </section>
      )}

      <Section title="Benefits" items={job.benefits} />

      {job.applicationInstructions && (
        <section className="section">
          <h3>How to apply</h3>
          <p className="pre">{job.applicationInstructions}</p>
        </section>
      )}

      <Link to={`/jobs/${job._id}/apply`} className="btn primary large">Apply for this job</Link>
    </div>
  );
}
