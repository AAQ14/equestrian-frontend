import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/axiosInstance';
import AuthLayout from './AuthLayout';

// Seeded accounts from DataSeeder.java (all use Password123!). Only for the demo.
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@equestrian.com' },
  { label: 'Instructor', email: 'layla@equestrian.com' },
  { label: 'Client', email: 'sara@equestrian.com' },
];

// Where each role lands after logging in.
const HOME_BY_ROLE = {
  CLIENT: '/sessions',
  INSTRUCTOR: '/instructor/sessions',
  ADMIN: '/admin/tournaments',
};

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Set by the axios 401 handler when the token has expired.
  const sessionExpired = searchParams.get('expired') === 'true';

  async function handleSubmit(event) {
    event.preventDefault(); // Stop the browser from reloading the page.
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      showToast(`Welcome back${user.firstName ? ', ' + user.firstName : ''}!`, 'success');
      // Go back to the page the user wanted, or to the home page of their role.
      navigate(location.state?.from || HOME_BY_ROLE[user.role] || '/', { replace: true });
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(demoEmail) {
    setEmail(demoEmail);
    setPassword('Password123!');
  }

  return (
    <AuthLayout eyebrow="Welcome back" title="Log in" subtitle="Sign in to book lessons and tickets.">
      {sessionExpired && (
        <p className="auth-notice">Your session has expired. Please log in again.</p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Link to="/forgot-password" className="auth-inline-link">
          Forgot password?
        </Link>

        <Button type="submit" fullWidth loading={loading} disabled={!email || !password}>
          {loading ? 'Signing in…' : 'Log in'}
        </Button>
      </form>

      <p className="auth-footer">
        New here? <Link to="/register">Create an account</Link>
      </p>

      <div className="demo-accounts">
        <p>Demo accounts</p>
        <div className="demo-list">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="demo-chip"
              onClick={() => fillDemo(account.email)}
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
