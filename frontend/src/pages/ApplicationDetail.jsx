import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, download, messagesOf } from '../api.js';
import { APPLICATION_STATUSES, formatDateTime, formatSize } from '../format.js';
import { ErrorNotice, Notice, Spinner } from '../components/Notice.jsx';

export default function ApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api
      .application(id)
      .then((data) => setApplication(data.application))
      .catch((err) => setErrors(messagesOf(err)));
  }, [id]);

  const changeStatus = async (event) => {
    const status = event.target.value;
    setMessage('');
    try {
      await api.applicationStatus(id, status);
      setApplication((current) => ({ ...current, status }));
      setMessage(`Status updated to "${status}".`);
      setErrors([]);
    } catch (err) {
      setErrors(messagesOf(err));
    }
  };

  const addNote = async (event) => {
    event.preventDefault();
    if (!note.trim()) {
      setErrors(['Write a note before saving']);
      return;
    }
    try {
      const data = await api.addNote(id, note.trim());
      setApplication((current) => ({ ...current, notes: data.notes }));
      setNote('');
      setErrors([]);
      setMessage('Note added.');
    } catch (err) {
      setErrors(messagesOf(err));
    }
  };

  const getResume = async () => {
    try {
      await download(api.resumePath(id), application.resume.filename);
    } catch (err) {
      setErrors(messagesOf(err));
    }
  };

  if (!application) {
    return errors.length ? (
      <div className="panel">
        <ErrorNotice messages={errors} />
        <Link to="/admin/applications" className="btn ghost">Back to applications</Link>
      </div>
    ) : (
      <Spinner />
    );
  }

  return (
    <div className="panel detail">
      <Link to="/admin/applications" className="back">&larr; All applications</Link>
      <h1>{application.name}</h1>
      <p className="company">
        Applied for {application.job ? `${application.job.title} at ${application.job.company}` : 'a deleted job'}
      </p>

      <Notice>{message}</Notice>
      <ErrorNotice messages={errors} />

      <div className="info-grid">
        <div><small>Email</small><strong>{application.email}</strong></div>
        <div><small>Phone</small><strong>{application.phone}</strong></div>
        <div><small>Applied on</small><strong>{formatDateTime(application.createdAt)}</strong></div>
        <div>
          <small>Status</small>
          <select value={application.status} onChange={changeStatus}>
            {APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
      </div>

      <section className="section">
        <h3>Educational qualifications</h3>
        <p className="pre">{application.education}</p>
      </section>
      <section className="section">
        <h3>Experience</h3>
        <p className="pre">{application.experience}</p>
      </section>
      <section className="section">
        <h3>Technical skills</h3>
        <p className="pre">{application.skills}</p>
      </section>
      <section className="section">
        <h3>Cover letter</h3>
        <p className="pre">{application.coverLetter || 'No cover letter provided.'}</p>
      </section>
      <section className="section">
        <h3>Resume</h3>
        <p>{application.resume.filename} ({formatSize(application.resume.size)})</p>
        <button className="btn primary small" onClick={getResume}>Download resume</button>
      </section>

      <section className="section">
        <h3>Internal notes</h3>
        {application.notes.length === 0 && <p className="muted">No notes yet.</p>}
        {application.notes.map((item) => (
          <div className="note" key={item._id}>
            <p className="pre">{item.text}</p>
            <small>{item.author} · {formatDateTime(item.createdAt)}</small>
          </div>
        ))}
        <form onSubmit={addNote}>
          <textarea rows="3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a private note for the recruitment team" maxLength={1000} />
          <button className="btn ghost small">Add note</button>
        </form>
      </section>
    </div>
  );
}
