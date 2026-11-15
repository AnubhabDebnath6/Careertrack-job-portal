import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, messagesOf } from '../api.js';
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS } from '../format.js';
import { ErrorNotice, Spinner } from '../components/Notice.jsx';

const blank = {
  title: '',
  company: '',
  location: '',
  employmentType: 'Full-time',
  experienceLevel: 'Fresher',
  salaryMin: '',
  salaryMax: '',
  description: '',
  responsibilities: '',
  qualifications: '',
  skills: '',
  benefits: '',
  applicationInstructions: '',
  deadline: '',
  status: 'draft'
};

const joinLines = (items) => (items || []).join('\n');

export default function JobForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [values, setValues] = useState(blank);
  const [loading, setLoading] = useState(editing);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api
      .adminJob(id)
      .then(({ job }) =>
        setValues({
          title: job.title,
          company: job.company,
          location: job.location,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          salaryMin: job.salaryMin || '',
          salaryMax: job.salaryMax || '',
          description: job.description,
          responsibilities: joinLines(job.responsibilities),
          qualifications: joinLines(job.qualifications),
          skills: joinLines(job.skills),
          benefits: joinLines(job.benefits),
          applicationInstructions: job.applicationInstructions || '',
          deadline: job.deadline ? job.deadline.slice(0, 10) : '',
          status: job.status
        })
      )
      .catch((err) => setErrors(messagesOf(err)))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const problems = [];
    if (!values.title.trim()) problems.push('Job title is required');
    if (!values.company.trim()) problems.push('Company name is required');
    if (!values.location.trim()) problems.push('Location is required');
    if (!values.description.trim()) problems.push('Job description is required');
    if (values.salaryMin && values.salaryMax && Number(values.salaryMax) < Number(values.salaryMin)) {
      problems.push('Maximum salary cannot be less than minimum salary');
    }
    if (problems.length) {
      setErrors(problems);
      return;
    }

    setBusy(true);
    setErrors([]);
    try {
      if (editing) await api.updateJob(id, values);
      else await api.createJob(values);
      navigate('/admin/jobs');
    } catch (err) {
      setErrors(messagesOf(err));
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="panel narrow">
      <h1>{editing ? 'Edit job' : 'Post a new job'}</h1>
      <form onSubmit={handleSubmit} noValidate>
        <ErrorNotice messages={errors} />

        <div className="two">
          <div className="field">
            <label htmlFor="title">Job title *</label>
            <input id="title" value={values.title} onChange={update('title')} maxLength={100} />
          </div>
          <div className="field">
            <label htmlFor="company">Company *</label>
            <input id="company" value={values.company} onChange={update('company')} maxLength={100} />
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="location">Location *</label>
            <input id="location" value={values.location} onChange={update('location')} maxLength={100} />
          </div>
          <div className="field">
            <label htmlFor="deadline">Application deadline</label>
            <input id="deadline" type="date" value={values.deadline} onChange={update('deadline')} />
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="employmentType">Employment type *</label>
            <select id="employmentType" value={values.employmentType} onChange={update('employmentType')}>
              {EMPLOYMENT_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="experienceLevel">Experience level *</label>
            <select id="experienceLevel" value={values.experienceLevel} onChange={update('experienceLevel')}>
              {EXPERIENCE_LEVELS.map((level) => <option key={level}>{level}</option>)}
            </select>
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="salaryMin">Minimum salary (per year, ₹)</label>
            <input id="salaryMin" type="number" min="0" value={values.salaryMin} onChange={update('salaryMin')} />
          </div>
          <div className="field">
            <label htmlFor="salaryMax">Maximum salary (per year, ₹)</label>
            <input id="salaryMax" type="number" min="0" value={values.salaryMax} onChange={update('salaryMax')} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="description">Description *</label>
          <textarea id="description" rows="5" value={values.description} onChange={update('description')} maxLength={3000} />
        </div>
        <div className="field">
          <label htmlFor="responsibilities">Responsibilities (one per line)</label>
          <textarea id="responsibilities" rows="4" value={values.responsibilities} onChange={update('responsibilities')} />
        </div>
        <div className="field">
          <label htmlFor="qualifications">Qualifications (one per line)</label>
          <textarea id="qualifications" rows="4" value={values.qualifications} onChange={update('qualifications')} />
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="skills">Required skills (one per line)</label>
            <textarea id="skills" rows="4" value={values.skills} onChange={update('skills')} />
          </div>
          <div className="field">
            <label htmlFor="benefits">Benefits (one per line)</label>
            <textarea id="benefits" rows="4" value={values.benefits} onChange={update('benefits')} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="applicationInstructions">Application instructions</label>
          <textarea id="applicationInstructions" rows="3" value={values.applicationInstructions} onChange={update('applicationInstructions')} maxLength={1000} />
        </div>
        <div className="field">
          <label htmlFor="status">Publication status</label>
          <select id="status" value={values.status} onChange={update('status')}>
            <option value="draft">Draft (not visible to public)</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="actions">
          <button className="btn primary" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Create job'}</button>
          <Link to="/admin/jobs" className="btn ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
