import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { forgotPassword, resetPassword, verifyResetCode } from '../../api/authApi';
import { getErrorMessage } from '../../api/axiosInstance';
import AuthLayout from './AuthLayout';

// Forgot password in 3 steps on one page:
// 1. email -> the server emails a 6-digit code
// 2. code  -> the server gives back a short-lived reset token
// 3. new password, sent with that reset token
const STEP_TEXT = {
  1: 'Enter your email and we will send you a 6-digit code.',
  2: 'Enter the code we sent to your inbox.',
  3: 'Choose a new password.',
};

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  // Runs one API call with loading state and error toast, so each step stays short.
  async function run(action) {
    setLoading(true);
    try {
      await action();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  function sendCode(event) {
    event.preventDefault();
    run(async () => {
      await forgotPassword(email.trim());
      showToast('Code sent! Check your email.', 'success');
      setStep(2);
    });
  }

  function checkCode(event) {
    event.preventDefault();
    run(async () => {
      const data = await verifyResetCode(email.trim(), code);
      setResetToken(data.resetToken);
      setStep(3);
    });
  }

  function saveNewPassword(event) {
    event.preventDefault();
    if (password !== confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    run(async () => {
      await resetPassword(resetToken, password);
      showToast('Password changed. Please log in.', 'success');
      navigate('/login');
    });
  }

  return (
    <AuthLayout eyebrow={`Step ${step} of 3`} title="Reset password" subtitle={STEP_TEXT[step]}>
      {step === 1 && (
        <form onSubmit={sendCode} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" fullWidth loading={loading} disabled={!email}>
            Send code
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={checkCode} noValidate>
          <div className="form-group">
            <label htmlFor="code">Reset code</label>
            <input
              id="code"
              className="code-input"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <Button type="submit" fullWidth loading={loading} disabled={code.length !== 6}>
            Verify code
          </Button>
          <button type="button" className="auth-inline-link" style={{ margin: '18px auto 0' }} onClick={() => setStep(1)}>
            Use another email
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={saveNewPassword} noValidate>
          <div className="form-group">
            <label htmlFor="password">New password</label>
            <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <p className="field-hint" style={{ marginTop: -10, marginBottom: 22 }}>
            8–30 characters, at least one letter and one number.
          </p>
          <Button type="submit" fullWidth loading={loading} disabled={!password}>
            Save password
          </Button>
        </form>
      )}

      <p className="auth-footer">
        Remembered it? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
