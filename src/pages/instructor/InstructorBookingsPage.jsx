import { useState } from 'react';
import Button from '../../components/Button';
import HorseAssignmentModal from '../../components/HorseAssignmentModal';
import { Badge, EmptyState, FilterPills, PageHeader, SkeletonRows } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bookingsApi, instructorsApi, sessionsApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import images from '../../assets/images';
import { BOOKING_STATUSES, findMyInstructor, formatDate, formatEnum, formatTime } from '../../utils/format';

// Bookings of the instructor's own sessions: confirm, complete, cancel, and set the horse.
export default function InstructorBookingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState('');
  const [horseFor, setHorseFor] = useState(null);
  const [busyId, setBusyId] = useState(null); // Booking currently being saved.

  const { data, loading, error, reload } = useApi(async () => {
    const [bookings, sessions, instructors] = await Promise.all([
      bookingsApi.list(status),
      sessionsApi.list(),
      instructorsApi.list(),
    ]);
    return { bookings, sessions, me: findMyInstructor(instructors, user) };
  }, [status]);

  // The backend returns all bookings to instructors, so keep only bookings of my sessions.
  const mySessions = (data?.sessions || []).filter((s) => data?.me && s.instructorId === data.me.id);
  const sessionOf = (booking) => mySessions.find((s) => s.id === booking.ridingSessionId);
  const bookings = (data?.bookings || []).filter(sessionOf).sort((a, b) => b.id - a.id);

  async function changeStatus(booking, newStatus) {
    setBusyId(booking.id);
    try {
      await bookingsApi.changeStatus(booking.id, newStatus);
      showToast(`Booking #${booking.id} is now ${formatEnum(newStatus).toLowerCase()}.`, 'success');
      reload(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Bookings" subtitle="Riders in your sessions" image={images.headerAccount} />

      <section className="container content">
        <div className="toolbar">
          <FilterPills options={BOOKING_STATUSES} value={status} onChange={setStatus} />
        </div>

        {loading && <SkeletonRows />}
        {!loading && error && <EmptyState icon="⚠️" title="Could not load bookings" text={error.message} />}
        {!loading && !error && bookings.length === 0 && (
          <EmptyState title="No bookings yet" text="Bookings for your sessions will show up here." />
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Client</th><th>Session</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const session = sessionOf(booking);
                  const busy = busyId === booking.id;
                  return (
                    <tr key={booking.id}>
                      <td>{booking.id}</td>
                      <td>User #{booking.userId}</td>
                      <td>#{session.id} · {formatEnum(session.skillLevel)}</td>
                      <td>{formatDate(session.date)}</td>
                      <td>{formatTime(session.startTime)} – {formatTime(session.endTime)}</td>
                      <td><Badge status={booking.bookingStatus} /></td>
                      <td>
                        <div className="table-actions">
                          {booking.bookingStatus === 'PENDING' && (
                            <Button size="sm" loading={busy} onClick={() => changeStatus(booking, 'CONFIRMED')}>Confirm</Button>
                          )}
                          {booking.bookingStatus === 'CONFIRMED' && (
                            <Button size="sm" loading={busy} onClick={() => changeStatus(booking, 'COMPLETED')}>Complete</Button>
                          )}
                          {(booking.bookingStatus === 'PENDING' || booking.bookingStatus === 'CONFIRMED') && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setHorseFor(booking)}>Horse</Button>
                              <Button size="sm" variant="danger" disabled={busy} onClick={() => changeStatus(booking, 'CANCELLED')}>
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {horseFor && <HorseAssignmentModal booking={horseFor} onClose={() => setHorseFor(null)} />}
    </>
  );
}
