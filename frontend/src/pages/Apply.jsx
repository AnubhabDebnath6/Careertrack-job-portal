import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, messagesOf } from '../api.js';
import { ErrorNotice, Spinner } from '../components/Notice.jsx';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  education: '',
  experience: '',
  skills: '',
  coverLetter: ''
};

function validate(values, file) {
  const errors = [];
  if (values.name.trim().length < 2) errors.push('Enter your full name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) errors.push('Enter a valid email address');
  if (!/^\+?[0-9][0-9\s-]{8,14}$/.test(values.phone.trim())) errors.push('Enter a valid phone number (10 to 15 digits)');
  if (!values.education.trim()) errors.push('Educational qualifications are required');
  if (!values.experience.trim()) errors.push('Experience is required (write "Fresher" if you have none)');
  if (!values.skills.trim()) errors.push('Technical skills are required');
  if (!file) {
    errors.push('Upload your resume');
  } else {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(extension)) errors.push('Resume must be a PDF or DOCX file');
    else if (file.size > 2 * 1024 * 1024) errors.push('Resume must be 2 MB or smaller');
  }
  return errors;
}

export default function Apply() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState([]);
  const [values, setValues] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api
      .job(id)
      .then((data) => setJob(data.job))
      .catch((err) => setLoadErrors(messagesOf(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const problems = validate(values, file);
    if (problems.length) {
      setErrors(problems);
      return;
    }

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, value.trim()));
    formData.append('resume', file);

    setSubmitting(true);
    setErrors([]);
    try {
      const data = await api.apply(id, formData);
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrors(messagesOf(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  if (!job) {
    return (
      <div className="panel">
        <ErrorNotice messages={loadErrors} />
        <Link to="/" className="btn ghost">Back to all jobs</Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="panel center success-panel">
        <div className="tick">&#10003;</div>
        <h1>Application submitted</h1>
        <p>{result.message}.</p>
        <p>
          You applied for <strong>{job.title}</strong> at <strong>{job.company}</strong>.
        </p>
        <p className="muted">Reference ID: {result.applicationId}</p>
        <p className="muted">Current status: {result.status}</p>
        <Link to="/" className="btn primary">Browse more jobs</Link>
      </div>
    );
  }

  return (
    <div className="panel narrow">
      <Link to={`/jobs/${id}`} className="back">&larr; Back to job details</Link>
      <h1>Apply for {job.title}</h1>
      <p className="company">{job.company} · {job.location}</p>

      <form onSubmit={handleSubmit} noValidate>
        <ErrorNotice messages={errors} />

        <div className="field">
          <label htmlFor="name">Full name *</label>
          <input id="name" value={values.name} onChange={update('name')} maxLength={80} />
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="email">Email *</label>
            <input id="email" type="email" value={values.email} onChange={update('email')} maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone number *</label>
            <input id="phone" value={values.phone} onChange={update('phone')} maxLength={16} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="education">Educational qualifications *</label>
          <textarea id="education" rows="2" value={values.education} onChange={update('education')} maxLength={500} />
        </div>
        <div className="field">
          <label htmlFor="experience">Experience *</label>
          <textarea id="experience" rows="3" value={values.experience} onChange={update('experience')} maxLength={1000} />
        </div>
        <div className="field">
          <label htmlFor="skills">Technical skills *</label>
          <input id="skills" value={values.skills} onChange={update('skills')} maxLength={500} placeholder="e.g. React, Node.js, MongoDB" />
        </div>
        <div className="field">
          <label htmlFor="coverLetter">Cover letter</label>
          <textarea id="coverLetter" rows="5" value={values.coverLetter} onChange={update('coverLetter')} maxLength={2000} />
        </div>
        <div className="field">
          <label htmlFor="resume">Resume (PDF or DOCX, max 2 MB) *</label>
          <input id="resume" type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files[0] || null)} />
        </div>

        <button className="btn primary large" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}
