import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Navbar.css';

// Menu items for each role. The Navbar only shows the list for the signed-in role.
const LINKS_BY_ROLE = {
  GUEST: [
    { to: '/', label: 'Home' },
    { to: '/sessions', label: 'Lessons' },
    { to: '/tournaments', label: 'Tournaments' },
  ],
  CLIENT: [
    { to: '/sessions', label: 'Lessons' },
    { to: '/my-bookings', label: 'My bookings' },
    { to: '/tournaments', label: 'Tournaments' },
    { to: '/my-tickets', label: 'My tickets' },
  ],
  INSTRUCTOR: [
    { to: '/instructor/sessions', label: 'My sessions' },
    { to: '/instructor/bookings', label: 'Bookings' },
    { to: '/tournaments', label: 'Tournaments' },
    { to: '/my-tickets', label: 'My tickets' },
  ],
  ADMIN: [
    { to: '/admin/tournaments', label: 'Tournaments' },
    { to: '/admin/tickets', label: 'Tickets' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/horses', label: 'Horses' },
    { to: '/admin/instructors', label: 'Instructors' },
    { to: '/admin/audit-logs', label: 'Audit log' },
    { to: '/admin/concurrency', label: 'Demo' },
  ],
};

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // On the home page the navbar is transparent over the photo until the user scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu after navigating to another page.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const isHome = location.pathname === '/';
  const transparent = isHome && !scrolled && !menuOpen;
  const links = LINKS_BY_ROLE[isLoggedIn ? user.role : 'GUEST'];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className={`navbar ${transparent ? 'navbar-transparent' : 'navbar-solid'}`}>
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo" aria-label="Equestria home">
          <span className="logo-mark" aria-hidden="true">E</span>
          <span className="logo-text">Equestria</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="main-menu" className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <ul className="navbar-links">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end className="navbar-link">
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="navbar-actions">
            {isLoggedIn ? (
              <>
                <NotificationBell />
                <span className="navbar-user">
                  {user.firstName || user.email}
                  <span className="role-pill">{user.role}</span>
                </span>
                <button className="navbar-link navbar-logout" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="navbar-link">
                  Log in
                </NavLink>
                <Link to="/register" className="navbar-cta">
                  Join the club
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
