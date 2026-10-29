import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { verifyEmail } from '../../api/authApi';
import { getErrorMessage } from '../../api/axiosInstance';
import AuthLayout from './AuthLayout';

export default function VerifyEmailPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // The register page passes the email in the navigation state.
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await verifyEmail(email.trim(), code);
      showToast('Email verified! You can log in now.', 'success');
      navigate('/login');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="One last step"
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your inbox."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="code">Verification code</label>
          <input
            id="code"
            className="code-input"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            value={code}
            // Keep only digits, so letters cannot be typed.
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
          />
        </div>

        <Button type="submit" fullWidth loading={loading} disabled={code.length !== 6 || !email}>
          Verify
        </Button>
      </form>

      <p className="auth-footer">
        Already verified? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
