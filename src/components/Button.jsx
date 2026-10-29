import './Button.css';

// Reusable button.
// variant: 'primary' (black) | 'outline' | 'light' (white, for dark photos) | 'danger'
// size: 'md' | 'sm' (smaller, for cards and tables)
// loading: shows a small spinner and disables the button, so it cannot be clicked twice.
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  type = 'button',
  className = '',
  ...rest
}) {
  const classes = ['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : '', fullWidth ? 'btn-full' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button {...rest} type={type} className={classes} disabled={loading || rest.disabled}>
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
