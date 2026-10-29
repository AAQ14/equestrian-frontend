import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import HorseAssignmentModal from '../../components/HorseAssignmentModal';
import { Badge, EmptyState, FilterPills, Modal, PageHeader, SkeletonRows } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { bookingsApi, sessionsApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import images from '../../assets/images';
import { BOOKING_STATUSES, formatDate, formatEnum, formatPrice, formatTime } from '../../utils/format';

// The client's own bookings: filter by status, cancel, and manage the horse.
export default function MyBookingsPage() {
  const { showToast } = useToast();
  const [status, setStatus] = useState('');
  const [toCancel, setToCancel] = useState(null);
  const [horseFor, setHorseFor] = useState(null); // Booking whose horse dialog is open.
  const [saving, setSaving] = useState(false);

  // [status] = load again when the filter changes (the backend filters by status).
  const { data, loading, error, reload } = useApi(async () => {
    const [bookings, sessions] = await Promise.all([bookingsApi.list(status), sessionsApi.list()]);
    return { bookings, sessions };
  }, [status]);

  const sessionOf = (booking) => data?.sessions.find((s) => s.id === booking.ridingSessionId);
  const bookings = [...(data?.bookings || [])].sort((a, b) => b.id - a.id);

  async function cancelBooking() {
    setSaving(true);
    try {
      await bookingsApi.changeStatus(toCancel.id, 'CANCELLED');
      showToast('Booking cancelled.', 'success');
      setToCancel(null);
      reload(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  const isActive = (booking) => booking.bookingStatus === 'PENDING' || booking.bookingStatus === 'CONFIRMED';

  return (
    <>
      <PageHeader title="My bookings" subtitle="Your upcoming and past rides" image={images.headerAccount} />

      <section className="container content">
        <div className="toolbar">
          <FilterPills options={BOOKING_STATUSES} value={status} onChange={setStatus} />
          <Link to="/sessions" className="btn btn-outline btn-sm">Book a new lesson</Link>
        </div>

        {loading && <SkeletonRows />}
        {!loading && error && <EmptyState icon="⚠️" title="Could not load bookings" text={error.message} />}
        {!loading && !error && bookings.length === 0 && (
          <EmptyState title="No bookings yet" text="Book your first riding lesson today.">
            <Link to="/sessions" className="btn btn-primary">See lessons</Link>
          </EmptyState>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Lesson</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const session = sessionOf(booking);
                  return (
                    <tr key={booking.id}>
                      <td>{booking.id}</td>
                      <td>{session ? `${formatEnum(session.skillLevel)} lesson` : `Session #${booking.ridingSessionId}`}</td>
                      <td>{formatDate(session?.date)}</td>
                      <td>{session ? `${formatTime(session.startTime)} – ${formatTime(session.endTime)}` : '—'}</td>
                      <td>{session ? formatPrice(session.price) : '—'}</td>
                      <td><Badge status={booking.bookingStatus} /></td>
                      <td>
                        {isActive(booking) ? (
                          <div className="table-actions">
                            <Button size="sm" variant="outline" onClick={() => setHorseFor(booking)}>Horse</Button>
                            <Button size="sm" variant="danger" onClick={() => setToCancel(booking)}>Cancel</Button>
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {toCancel && (
        <Modal
          title="Cancel booking?"
          onClose={() => setToCancel(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setToCancel(null)}>Keep it</Button>
              <Button variant="danger" size="sm" loading={saving} onClick={cancelBooking}>Yes, cancel</Button>
            </>
          }
        >
          <p>Booking #{toCancel.id} will be cancelled and your place will be freed for other riders.</p>
        </Modal>
      )}

      {horseFor && <HorseAssignmentModal booking={horseFor} onClose={() => setHorseFor(null)} />}
    </>
  );
}
