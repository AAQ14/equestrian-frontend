import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import SessionsPage from './pages/client/SessionsPage';
import MyBookingsPage from './pages/client/MyBookingsPage';
import MyTicketsPage from './pages/client/MyTicketsPage';
import TournamentsPage from './pages/tournaments/TournamentsPage';
import TournamentDetailPage from './pages/tournaments/TournamentDetailPage';
import InstructorSessionsPage from './pages/instructor/InstructorSessionsPage';
import InstructorBookingsPage from './pages/instructor/InstructorBookingsPage';
import AdminTournamentsPage from './pages/admin/AdminTournamentsPage';
import AdminTicketsPage from './pages/admin/AdminTicketsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminHorsesPage from './pages/admin/AdminHorsesPage';
import AdminInstructorsPage from './pages/admin/AdminInstructorsPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import ConcurrencyDemoPage from './pages/admin/ConcurrencyDemoPage';

// All the routes of the app. ProtectedRoute checks login and role before showing a page.
export default function App() {
  const location = useLocation();

  return (
    <>
      <Navbar />
      {/* key changes on every page, so the fade-in animation plays again. */}
      <div key={location.pathname} className="page-fade">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/sessions" element={<SessionsPage />} />

          {/* Any signed-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          </Route>

          {/* Clients only */}
          <Route element={<ProtectedRoute roles={['CLIENT']} />}>
            <Route path="/my-bookings" element={<MyBookingsPage />} />
          </Route>

          {/* Clients and instructors can buy tickets */}
          <Route element={<ProtectedRoute roles={['CLIENT', 'INSTRUCTOR']} />}>
            <Route path="/my-tickets" element={<MyTicketsPage />} />
          </Route>

          {/* Instructors only */}
          <Route element={<ProtectedRoute roles={['INSTRUCTOR']} />}>
            <Route path="/instructor/sessions" element={<InstructorSessionsPage />} />
            <Route path="/instructor/bookings" element={<InstructorBookingsPage />} />
          </Route>

          {/* Admins only */}
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin/tournaments" element={<AdminTournamentsPage />} />
            <Route path="/admin/tickets" element={<AdminTicketsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/horses" element={<AdminHorsesPage />} />
            <Route path="/admin/instructors" element={<AdminInstructorsPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogPage />} />
            <Route path="/admin/concurrency" element={<ConcurrencyDemoPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}
