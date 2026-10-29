import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

// Shown for any URL that does not match a route.
export default function NotFoundPage() {
  return (
    <div className="page container">
      <EmptyState title="Page not found" text="This path leads nowhere. Let's ride back home.">
        <Link to="/" className="btn btn-primary">Back home</Link>
      </EmptyState>
    </div>
  );
}
