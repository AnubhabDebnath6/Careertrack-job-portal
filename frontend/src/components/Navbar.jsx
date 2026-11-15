import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Navbar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand">
          Career<span>Track</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>Jobs</NavLink>
          {admin ? (
            <>
              <NavLink to="/admin" end>Dashboard</NavLink>
              <NavLink to="/admin/jobs">Manage Jobs</NavLink>
              <NavLink to="/admin/applications">Applications</NavLink>
              <button className="link-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <NavLink to="/admin/login">Admin Login</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
