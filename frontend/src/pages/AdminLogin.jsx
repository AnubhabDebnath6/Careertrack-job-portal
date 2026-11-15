import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { messagesOf } from '../api.js';
import { ErrorNotice } from '../components/Notice.jsx';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setErrors(['Enter your email and password']);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      await login(email.trim(), password);
      navigate((location.state && location.state.from) || '/admin', { replace: true });
    } catch (err) {
      setErrors(messagesOf(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel login">
      <h1>Administrator login</h1>
      <p className="muted">Sign in to manage job postings and applications.</p>
      <form onSubmit={handleSubmit} noValidate>
        <ErrorNotice messages={errors} />
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button className="btn primary large" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  );
}
