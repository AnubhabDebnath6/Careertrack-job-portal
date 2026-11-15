import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Spinner } from './Notice.jsx';

export default function ProtectedRoute({ children }) {
  const { admin, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <Spinner label="Checking session..." />;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}
