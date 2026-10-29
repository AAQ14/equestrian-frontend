import images from '../../assets/images';
import './Auth.css';

// Shared layout for all auth pages: a photo on the left, the form card on the right.
export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-photo" style={{ backgroundImage: `url(${images.authPhoto})` }}>
        <div className="auth-photo-overlay" />
        <p className="auth-photo-quote">
          “The best view comes
          <br />
          from the saddle.”
        </p>
      </aside>

      <main className="auth-panel">
        <div className="auth-card fade-up">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
