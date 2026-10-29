import { useState } from 'react';
import Button from '../../components/Button';
import { Badge, EmptyState, FilterPills, Modal, PageHeader, SkeletonRows } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bookingsApi, instructorsApi, sessionsApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import images from '../../assets/images';
import SessionFormModal from './SessionFormModal';
import {
  findMyInstructor, formatDate, formatEnum, formatPrice, formatTime, SESSION_STATUSES,
} from '../../utils/format';

// The instructor's own sessions: create, edit, cancel, and book a client in.
export default function InstructorSessionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState('');
  const [formFor, setFormFor] = useState(null); // null = closed, 'new' = create, a session = edit.
  const [toCancel, setToCancel] = useState(null);
  const [bookFor, setBookFor] = useState(null);
  const [clientId, setClientId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useApi(async () => {
    const [sessions, instructors] = await Promise.all([sessionsApi.list(), instructorsApi.list()]);
    return { sessions, me: findMyInstructor(instructors, user) };
  });

  const me = data?.me;
  const sessions = (data?.sessions || [])
    .filter((s) => me && s.instructorId === me.id)
    .filter((s) => !status || s.sessionStatus === status)
    .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));

  // Runs an action with loading state, toast and reload.
  async function run(action, message, close) {
    setSaving(true);
    try {
      await action();
      showToast(message, 'success');
      close();
      reload(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  const cancelSession = () =>
    run(() => sessionsApi.cancel(toCancel.id), 'Session cancelled. Riders were notified.', () => setToCancel(null));

  const bookClient = () =>
    run(
      () => bookingsApi.create({ ridingSessionId: bookFor.id, userId: Number(clientId) }),
      `Client #${clientId} booked into the session.`,
      () => {
        setBookFor(null);
        setClientId('');
      }
    );

  const isOpen = (s) => s.sessionStatus === 'AVAILABLE' || s.sessionStatus === 'FULL';

  return (
    <>
      <PageHeader title="My sessions" subtitle="Plan your lessons" image={images.headerLessons} />

      <section className="container content">
        <div className="toolbar">
          <FilterPills options={SESSION_STATUSES} value={status} onChange={setStatus} />
          <Button size="sm" disabled={!me} onClick={() => setFormFor('new')}>+ New session</Button>
        </div>

        {loading && <SkeletonRows />}
        {!loading && error && <EmptyState icon="⚠️" title="Could not load sessions" text={error.message} />}
        {!loading && !error && !me && (
          <EmptyState
            icon="🔎"
            title="Instructor profile not found"
            text="Ask an admin to create an instructor profile for your account."
          />
        )}
        {!loading && !error && me && sessions.length === 0 && (
          <EmptyState title="No sessions yet" text="Create your first riding session." />
        )}

        {!loading && !error && me && sessions.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Date</th><th>Time</th><th>Level</th><th>Capacity</th><th>Price</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.id}</td>
                    <td>{formatDate(session.date)}</td>
                    <td>{formatTime(session.startTime)} – {formatTime(session.endTime)}</td>
                    <td>{formatEnum(session.skillLevel)}</td>
                    <td>{session.capacity}</td>
                    <td>{formatPrice(session.price)}</td>
                    <td><Badge status={session.sessionStatus} /></td>
                    <td>
                      {isOpen(session) ? (
                        <div className="table-actions">
                          <Button size="sm" variant="outline" onClick={() => setFormFor(session)}>Edit</Button>
                          <Button size="sm" variant="outline" disabled={session.sessionStatus !== 'AVAILABLE'} onClick={() => setBookFor(session)}>
                            Book client
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setToCancel(session)}>Cancel</Button>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formFor && (
        <SessionFormModal
          session={formFor === 'new' ? null : formFor}
          instructorId={me.id}
          onClose={() => setFormFor(null)}
          onSaved={() => {
            setFormFor(null);
            reload(true);
          }}
        />
      )}

      {toCancel && (
        <Modal
          title="Cancel session?"
          onClose={() => setToCancel(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setToCancel(null)}>Keep it</Button>
              <Button variant="danger" size="sm" loading={saving} onClick={cancelSession}>Yes, cancel</Button>
            </>
          }
        >
          <p>
            The session on {formatDate(toCancel.date)} will be cancelled. All its bookings are cancelled and the riders get a
            notification.
          </p>
        </Modal>
      )}

      {bookFor && (
        <Modal
          title="Book a client"
          onClose={() => setBookFor(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setBookFor(null)}>Back</Button>
              <Button size="sm" loading={saving} disabled={!clientId} onClick={bookClient}>Book</Button>
            </>
          }
        >
          <p className="muted" style={{ marginTop: 0 }}>
            Session #{bookFor.id} · {formatDate(bookFor.date)} · {formatTime(bookFor.startTime)}
          </p>
          <div className="form-group">
            <label htmlFor="clientId">Client user ID</label>
            <input id="clientId" type="number" min="1" value={clientId} onChange={(e) => setClientId(e.target.value)} />
          </div>
        </Modal>
      )}
    </>
  );
}
