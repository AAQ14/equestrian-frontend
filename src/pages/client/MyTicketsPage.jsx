import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { Badge, EmptyState, FilterPills, Modal, PageHeader, SkeletonCards } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { ticketsApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import images from '../../assets/images';
import { formatDateTime, formatEnum, formatPrice } from '../../utils/format';
import './MyTicketsPage.css';

// The user's tickets, shown as paper tickets. A ticket can be cancelled or moved to another seat.
export default function MyTicketsPage() {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useApi(ticketsApi.my);
  const [status, setStatus] = useState('');
  const [toCancel, setToCancel] = useState(null);
  const [saving, setSaving] = useState(false);

  const tickets = (data || [])
    .filter((t) => !status || t.ticketStatus === status)
    .sort((a, b) => b.id - a.id);

  async function cancelTicket() {
    setSaving(true);
    try {
      await ticketsApi.cancelMine(toCancel.id);
      showToast('Ticket cancelled. The seat is free again.', 'success');
      setToCancel(null);
      reload(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="My tickets" subtitle="See you at the arena" image={images.headerTournaments} />

      <section className="container content">
        <div className="toolbar">
          <FilterPills options={['PENDING', 'CONFIRMED', 'CANCELLED']} value={status} onChange={setStatus} />
          <Link to="/tournaments" className="btn btn-outline btn-sm">Buy a ticket</Link>
        </div>

        {loading && <SkeletonCards count={3} />}
        {!loading && error && <EmptyState icon="⚠️" title="Could not load tickets" text={error.message} />}
        {!loading && !error && tickets.length === 0 && (
          <EmptyState icon="🎟" title="No tickets yet" text="Pick a tournament and choose your seat.">
            <Link to="/tournaments" className="btn btn-primary">See tournaments</Link>
          </EmptyState>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="ticket-list">
            {tickets.map((ticket, index) => {
              const cancelled = ticket.ticketStatus === 'CANCELLED';
              return (
                <article
                  key={ticket.id}
                  className={`ticket ${cancelled ? 'ticket-cancelled' : ''}`}
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  <div className="ticket-main">
                    <p className="eyebrow" style={{ margin: 0 }}>Ticket #{ticket.id}</p>
                    <h3>{ticket.tournamentName}</h3>
                    <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
                      Bought {formatDateTime(ticket.createdAt)} · Payment {formatEnum(ticket.paymentStatus)}
                    </p>
                    <div style={{ marginTop: 14 }}>
                      <Badge status={ticket.ticketStatus} />
                    </div>
                  </div>

                  {/* The right part is the "stub" with the seat number. */}
                  <div className="ticket-stub">
                    <span className="stub-label">Seat</span>
                    <span className="stub-seat">{ticket.seatNumber}</span>
                    <span className="stub-price">{formatPrice(ticket.price)}</span>
                    {!cancelled && (
                      <div className="stub-actions">
                        <Link
                          to={`/tournaments/${ticket.tournamentId}?changeTicket=${ticket.id}&seat=${ticket.seatId}`}
                          className="btn btn-outline btn-sm"
                        >
                          Change seat
                        </Link>
                        <Button size="sm" variant="danger" onClick={() => setToCancel(ticket)}>Cancel</Button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {toCancel && (
        <Modal
          title="Cancel ticket?"
          onClose={() => setToCancel(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setToCancel(null)}>Keep it</Button>
              <Button variant="danger" size="sm" loading={saving} onClick={cancelTicket}>Yes, cancel</Button>
            </>
          }
        >
          <p>
            Seat {toCancel.seatNumber} for <strong>{toCancel.tournamentName}</strong> will be released.
            Tickets can only be cancelled for upcoming tournaments.
          </p>
        </Modal>
      )}
    </>
  );
}
