import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { Badge, EmptyState, FilterPills, Modal, PageHeader, SkeletonCards } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bookingsApi, instructorsApi, sessionsApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import images, { skillImages } from '../../assets/images';
import { formatDate, formatEnum, formatPrice, formatTime, SESSION_STATUSES, SKILL_LEVELS } from '../../utils/format';

// Lists riding sessions with filters. Clients can book a session from here.
export default function SessionsPage() {
  const { user, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Load sessions and instructors at the same time (Promise.all), so we can show instructor names.
  const { data, loading, error, reload } = useApi(async () => {
    const [sessions, instructors] = await Promise.all([sessionsApi.list(), instructorsApi.list()]);
    return { sessions, instructors };
  });

  const [status, setStatus] = useState('AVAILABLE');
  const [skillLevel, setSkillLevel] = useState('');
  const [date, setDate] = useState('');
  const [selected, setSelected] = useState(null); // The session in the "confirm booking" dialog.
  const [booking, setBooking] = useState(false);

  // Filters run in the browser, so all three can be combined.
  const sessions = (data?.sessions || [])
    .filter((s) => !status || s.sessionStatus === status)
    .filter((s) => !skillLevel || s.skillLevel === skillLevel)
    .filter((s) => !date || s.date === date)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));

  function instructorName(id) {
    const instructor = data?.instructors.find((i) => i.id === id);
    return instructor ? `${instructor.firstName} ${instructor.lastName}` : `Instructor #${id}`;
  }

  async function confirmBooking() {
    setBooking(true);
    try {
      await bookingsApi.create({ ridingSessionId: selected.id });
      showToast('Booked! Your booking is pending confirmation.', 'success');
      setSelected(null);
      reload(true);
      navigate('/my-bookings');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBooking(false);
    }
  }

  const canBook = user?.role === 'CLIENT';

  return (
    <>
      <PageHeader title="Riding lessons" subtitle="Find a session for your level" image={images.headerLessons} />

      <section className="container content">
        <div className="filters">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {SESSION_STATUSES.map((s) => (
                <option key={s} value={s}>{formatEnum(s)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <FilterPills options={SKILL_LEVELS} value={skillLevel} onChange={setSkillLevel} allLabel="All levels" />
        </div>

        {loading && <SkeletonCards />}

        {!loading && error && !isLoggedIn && (
          <EmptyState title="Log in to see our lessons" text="Create a free account to view and book riding sessions.">
            <Link to="/login" className="btn btn-primary">Log in</Link>
          </EmptyState>
        )}

        {!loading && error && isLoggedIn && <EmptyState icon="⚠️" title="Could not load lessons" text={error.message} />}

        {!loading && !error && sessions.length === 0 && (
          <EmptyState title="No lessons found" text="Try another date, level or status." />
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="card-grid">
            {sessions.map((session) => (
              <article key={session.id} className="card">
                <div className="card-image">
                  <img src={skillImages[session.skillLevel]} alt="" loading="lazy" />
                </div>
                <div className="card-body">
                  <Badge status={session.sessionStatus} />
                  <h3 style={{ marginTop: 10 }}>{formatEnum(session.skillLevel)} lesson</h3>
                  <p className="muted" style={{ margin: 0 }}>with {instructorName(session.instructorId)}</p>
                  <ul className="card-meta">
                    <li><span>Date</span><span>{formatDate(session.date)}</span></li>
                    <li><span>Time</span><span>{formatTime(session.startTime)} – {formatTime(session.endTime)}</span></li>
                    <li><span>Type</span><span>{session.capacity === 1 ? 'Private' : `Group (max ${session.capacity})`}</span></li>
                    <li><span>Price</span><strong>{formatPrice(session.price)}</strong></li>
                  </ul>
                  {canBook && (
                    <Button
                      size="sm"
                      fullWidth
                      disabled={session.sessionStatus !== 'AVAILABLE'}
                      onClick={() => setSelected(session)}
                    >
                      {session.sessionStatus === 'AVAILABLE' ? 'Book this lesson' : 'Not available'}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <Modal
          title="Confirm booking"
          onClose={() => setSelected(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Back</Button>
              <Button size="sm" loading={booking} onClick={confirmBooking}>Book now</Button>
            </>
          }
        >
          <dl className="summary">
            <dt>Lesson</dt><dd>{formatEnum(selected.skillLevel)}</dd>
            <dt>Instructor</dt><dd>{instructorName(selected.instructorId)}</dd>
            <dt>Date</dt><dd>{formatDate(selected.date)}</dd>
            <dt>Time</dt><dd>{formatTime(selected.startTime)} – {formatTime(selected.endTime)}</dd>
            <dt>Price</dt><dd>{formatPrice(selected.price)}</dd>
          </dl>
        </Modal>
      )}
    </>
  );
}
