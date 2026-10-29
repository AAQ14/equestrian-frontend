import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { register } from '../../api/authApi';
import { getErrorMessage } from '../../api/axiosInstance';
import AuthLayout from './AuthLayout';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

// Same rules as RegisterRequest.java, so the user sees mistakes before sending.
function validate(form) {
  if (!form.firstName.trim() || !form.lastName.trim()) return 'First and last name are required.';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email.';
  if (form.phone && !/^\+?[0-9]{8,15}$/.test(form.phone))
    return 'Phone must have 8 to 15 digits, optionally starting with +.';
  if (form.password.length < 8 || form.password.length > 30)
    return 'Password must be between 8 and 30 characters.';
  if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
    return 'Password must contain at least one letter and one number.';
  if (form.password !== form.confirmPassword) return 'Passwords do not match.';
  return null;
}

export default function RegisterPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  // One change handler for all inputs: the input "name" says which field to update.
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      showToast(problem, 'error');
      return;
    }

    setLoading(true);
    try {
      // confirmPassword is only for the frontend, so it is not sent.
      const { confirmPassword, ...body } = form;
      body.email = body.email.trim();
      if (!body.phone) delete body.phone; // Phone is optional.
      await register(body);
      showToast('Account created! We sent a 6-digit code to your email.', 'success');
      navigate('/verify-email', { state: { email: body.email } });
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Join the club"
      title="Create account"
      subtitle="It takes one minute. You will verify your email with a code."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" type="tel" placeholder="+97336000000" value={form.phone} onChange={handleChange} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} required />
          </div>
        </div>
        <p className="field-hint" style={{ marginTop: -8, marginBottom: 20 }}>
          8–30 characters, at least one letter and one number.
        </p>

        <Button type="submit" fullWidth loading={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      <p className="auth-footer">
        Already a member? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
