import { useEffect } from 'react';
import { formatEnum } from '../utils/format';
import './ui.css';

// Small reusable UI pieces used on every page.

// ---------- Badge: coloured status label ----------
// The colour comes from the status: PENDING yellow, CONFIRMED/AVAILABLE green, CANCELLED red...
const BADGE_COLOURS = {
  PENDING: 'yellow',
  CONFIRMED: 'green',
  AVAILABLE: 'green',
  ACTIVE: 'green',
  ASSIGNED: 'green',
  UPCOMING: 'green',
  ONGOING: 'yellow',
  CANCELLED: 'red',
  INACTIVE: 'red',
  FULL: 'yellow',
  COMPLETED: 'grey',
  SOLD: 'grey',
  FAILED: 'red',
  REFUNDED: 'grey',
  UNAVAILABLE: 'red',
  RETIRED: 'grey',
  RESTING: 'yellow',
  IN_TRAINING: 'yellow',
};

export function Badge({ status }) {
  return <span className={`badge badge-${BADGE_COLOURS[status] || 'grey'}`}>{formatEnum(status)}</span>;
}

// ---------- Spinner ----------
export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// ---------- Skeleton: grey blocks shown while data loads ----------
export function SkeletonCards({ count = 6 }) {
  return (
    <div className="card-grid" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton skeleton-image" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5 }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton skeleton-row" />
      ))}
    </div>
  );
}

// ---------- Empty state / error state ----------
export function EmptyState({ icon = '🐎', title, text, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

// ---------- Modal: dialog box over the page ----------
export function Modal({ title, onClose, children, footer }) {
  // Close with the Escape key.
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {/* stopPropagation: a click inside the box must not close it. */}
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- PageHeader: photo banner with a big title (Bridge style) ----------
export function PageHeader({ title, subtitle, image }) {
  return (
    <header className="page-header" style={{ backgroundImage: image ? `url(${image})` : undefined }}>
      <div className="page-header-overlay" />
      <div className="container page-header-content">
        <h1 className="fade-up">{title}</h1>
        {subtitle && (
          <p className="fade-up" style={{ animationDelay: '0.15s' }}>
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}

// ---------- Filter pills: a row of buttons to filter a list ----------
export function FilterPills({ options, value, onChange, allLabel = 'All' }) {
  return (
    <div className="filter-pills" role="group" aria-label="Filter">
      {['', ...options].map((option) => (
        <button
          key={option || 'all'}
          className={`pill ${value === option ? 'active' : ''}`}
          onClick={() => onChange(option)}
          aria-pressed={value === option}
        >
          {option ? formatEnum(option) : allLabel}
        </button>
      ))}
    </div>
  );
}
