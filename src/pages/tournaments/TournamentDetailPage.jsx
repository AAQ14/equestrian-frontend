import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '../../components/Button';
import SeatMap, { rowLetter, seatsPerRow } from '../../components/SeatMap';
import { Badge, EmptyState, Modal, PageHeader, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { ticketsApi, tournamentsApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import { tournamentImages } from '../../assets/images';
import { formatDate, formatEnum, formatPrice, formatTime } from '../../utils/format';
import './TournamentDetailPage.css';

const REFRESH_EVERY = 10000; // Reload the seats every 10 seconds, so sold seats appear.

// One tournament: details + cinema-style seat map + buying a ticket.
// With ?changeTicket=ID&seat=SEAT_ID in the URL, the page changes the seat of an existing ticket instead.
export default function TournamentDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { lastEvent } = useNotifications();

  const changeTicketId = searchParams.get('changeTicket');
  const ownSeatId = Number(searchParams.get('seat')) || null;
  const isChangeMode = Boolean(changeTicketId);

  const { data, loading, error, reload } = useApi(async () => {
    const [tournament, seats] = await Promise.all([tournamentsApi.get(id), tournamentsApi.seats(id)]);
    return { tournament, seats };
  }, [id]);

  const [selected, setSelected] = useState(null); // Seat the user clicked.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [boughtTicket, setBoughtTicket] = useState(null);

  // Refresh the seats regularly in the background (silent = no skeleton).
  useEffect(() => {
    const timer = setInterval(() => reload(true), REFRESH_EVERY);
    return () => clearInterval(timer);
  }, [reload]);

  // Refresh right away when a ticket notification arrives over SSE.
  useEffect(() => {
    if (lastEvent?.notificationType?.startsWith('TICKET')) reload(true);
  }, [lastEvent, reload]);

  // If the selected seat was sold in the meantime, unselect it.
  useEffect(() => {
    if (!selected || !data) return;
    const fresh = data.seats.find((s) => s.id === selected.id);
    if (fresh?.seatStatus === 'SOLD') {
      setSelected(null);
      showToast(`Seat ${selected.seatNumber} was just taken by someone else.`, 'info');
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="page"><Spinner /></div>;
  if (error) {
    return (
      <div className="page container">
        <EmptyState icon="⚠️" title="Tournament not found" text={error.message}>
          <Link to="/tournaments" className="btn btn-primary">Back to tournaments</Link>
        </EmptyState>
      </div>
    );
  }

  const { tournament, seats } = data;
  const perRow = seatsPerRow(seats.length);
  const available = seats.filter((s) => s.seatStatus === 'AVAILABLE').length;
  const isOpen = tournament.tournamentStatus === 'UPCOMING' || tournament.tournamentStatus === 'ONGOING';
  const canBuy = user.role !== 'ADMIN' && isOpen;

  // Clicking the selected seat again unselects it.
  function handleSelect(seat) {
    setSelected(selected?.id === seat.id ? null : seat);
  }

  async function confirmPurchase() {
    setBuying(true);
    try {
      if (isChangeMode) {
        await ticketsApi.changeSeat(changeTicketId, selected.id);
        showToast(`Your seat was changed to ${selected.seatNumber}.`, 'success');
        navigate('/my-tickets');
        return;
      }
      const ticket = await ticketsApi.buy(tournament.id, selected.id);
      setBoughtTicket(ticket);
      setConfirmOpen(false);
      setSelected(null);
      reload(true);
    } catch (err) {
      setConfirmOpen(false);
      if (err.response?.status === 409) {
        // Someone else bought this seat a moment before us.
        showToast('This seat was just taken, please choose another one.', 'error');
        setSelected(null);
        reload(true);
      } else {
        showToast(getErrorMessage(err), 'error');
      }
    } finally {
      setBuying(false);
    }
  }

  const label = (seat) => `Row ${rowLetter(seat.seatNumber, perRow)} · Seat ${seat.seatNumber}`;

  return (
    <>
      <PageHeader
        title={tournament.name}
        subtitle={`${formatEnum(tournament.tournamentType)} · ${formatDate(tournament.date)}`}
        image={tournamentImages[tournament.tournamentType]}
      />

      <section className="container content">
        <div className="tournament-layout">
          {/* ---------- Details ---------- */}
          <aside className="tournament-info">
            <Badge status={tournament.tournamentStatus} />
            <dl className="summary" style={{ marginTop: 18 }}>
              <dt>Date</dt><dd>{formatDate(tournament.date)}</dd>
              <dt>Time</dt><dd>{formatTime(tournament.time)}</dd>
              <dt>Venue</dt><dd>{tournament.venue}</dd>
              <dt>Ticket</dt><dd>{formatPrice(tournament.ticketPrice)}</dd>
              <dt>Free seats</dt><dd>{available} of {seats.length}</dd>
            </dl>
            <p className="tournament-description">{tournament.description}</p>
            <Link to="/tournaments" className="link-more">← All tournaments</Link>
          </aside>

          {/* ---------- Seat map ---------- */}
          <div>
            <div className="toolbar" style={{ marginBottom: 20 }}>
              <h2>{isChangeMode ? 'Pick your new seat' : 'Choose your seat'}</h2>
              <span className="muted" style={{ fontSize: '0.8rem' }}>Updates every 10 seconds</span>
            </div>
            {!canBuy && (
              <p className="seat-notice">
                {isOpen ? 'Admins can view the seat map but cannot buy tickets.' : 'Tickets are not on sale for this tournament.'}
              </p>
            )}
            {seats.length === 0 ? (
              <EmptyState icon="💺" title="No seats yet" text="Seats will appear here once they are created." />
            ) : (
              <SeatMap
                seats={seats}
                selectedId={selected?.id}
                ownSeatId={ownSeatId}
                onSelect={handleSelect}
                disabled={!canBuy || buying}
              />
            )}
          </div>
        </div>
      </section>

      {/* ---------- Bottom bar with the selected seat ---------- */}
      {selected && (
        <div className="checkout-bar">
          <div className="container checkout-inner">
            <div>
              <p className="checkout-seat">{label(selected)}</p>
              <p className="muted" style={{ margin: 0 }}>{formatPrice(selected.price)}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Clear</Button>
              <Button size="sm" onClick={() => setConfirmOpen(true)}>
                {isChangeMode ? 'Change seat' : 'Buy ticket'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Confirm dialog ---------- */}
      {confirmOpen && selected && (
        <Modal
          title={isChangeMode ? 'Change seat' : 'Confirm ticket'}
          onClose={() => !buying && setConfirmOpen(false)}
          footer={
            <>
              <Button variant="outline" size="sm" disabled={buying} onClick={() => setConfirmOpen(false)}>Back</Button>
              <Button size="sm" loading={buying} onClick={confirmPurchase}>
                {buying ? 'Locking your seat…' : isChangeMode ? 'Confirm change' : 'Pay & confirm'}
              </Button>
            </>
          }
        >
          <dl className="summary">
            <dt>Tournament</dt><dd>{tournament.name}</dd>
            <dt>Date</dt><dd>{formatDate(tournament.date)}, {formatTime(tournament.time)}</dd>
            <dt>Seat</dt><dd>{label(selected)}</dd>
            <dt>Price</dt><dd>{formatPrice(selected.price)}</dd>
          </dl>
          {buying && (
            <p className="muted" style={{ marginTop: 18, fontSize: '0.85rem' }}>
              The server is locking this seat so nobody else can buy it at the same time. This can take a few seconds.
            </p>
          )}
        </Modal>
      )}

      {/* ---------- Success dialog with a small ticket ---------- */}
      {boughtTicket && (
        <Modal
          title="Enjoy the show!"
          onClose={() => setBoughtTicket(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setBoughtTicket(null)}>Buy another</Button>
              <Button size="sm" onClick={() => navigate('/my-tickets')}>My tickets</Button>
            </>
          }
        >
          <div className="mini-ticket">
            <p className="eyebrow" style={{ margin: 0 }}>Ticket #{boughtTicket.id}</p>
            <h3>{boughtTicket.tournamentName}</h3>
            <p style={{ margin: 0 }}>
              Seat <strong>{boughtTicket.seatNumber}</strong> · {formatPrice(boughtTicket.price)}
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
