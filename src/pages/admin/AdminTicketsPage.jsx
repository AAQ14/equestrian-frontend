import { useState } from 'react';
import Button from '../../components/Button';
import { Badge, EmptyState, FilterPills, Modal, PageHeader, SkeletonRows } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { ticketsApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import images from '../../assets/images';
import { formatDateTime, formatPrice } from '../../utils/format';

// Admin: every ticket, a sales overview, and cancelling a ticket.
export default function AdminTicketsPage() {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useApi(ticketsApi.all);
  const [status, setStatus] = useState('');
  const [toCancel, setToCancel] = useState(null);
  const [saving, setSaving] = useState(false);

  const all = data || [];
  const sold = all.filter((t) => t.ticketStatus !== 'CANCELLED');
  const revenue = sold.reduce((sum, t) => sum + Number(t.price), 0);

  // Sales per tournament: { "Spring Cup": { count, revenue } }
  const perTournament = {};
  sold.forEach((t) => {
    const row = perTournament[t.tournamentName] || { count: 0, revenue: 0 };
    row.count += 1;
    row.revenue += Number(t.price);
    perTournament[t.tournamentName] = row;
  });

  const tickets = all.filter((t) => !status || t.ticketStatus === status).sort((a, b) => b.id - a.id);

  async function cancelTicket() {
    setSaving(true);
    try {
      await ticketsApi.cancelAsAdmin(toCancel.id);
      showToast(`Ticket #${toCancel.id} cancelled.`, 'success');
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
      <PageHeader title="Tickets & sales" image={images.headerTournaments} />

      <section className="container content">
        {loading && <SkeletonRows />}
        {!loading && error && <EmptyState icon="⚠️" title="Could not load tickets" text={error.message} />}

        {!loading && !error && (
          <>
            <div className="stat-cards">
              <div className="stat-card"><p className="value">{sold.length}</p><p className="label">Tickets sold</p></div>
              <div className="stat-card"><p className="value">{formatPrice(revenue)}</p><p className="label">Revenue</p></div>
              <div className="stat-card"><p className="value">{all.length - sold.length}</p><p className="label">Cancelled</p></div>
              <div className="stat-card"><p className="value">{Object.keys(perTournament).length}</p><p className="label">Events with sales</p></div>
            </div>

            {Object.keys(perTournament).length > 0 && (
              <>
                <div className="toolbar"><h2>Sales by tournament</h2></div>
                <div className="table-wrap" style={{ marginBottom: 48 }}>
                  <table className="table">
                    <thead><tr><th>Tournament</th><th>Tickets</th><th>Revenue</th></tr></thead>
                    <tbody>
                      {Object.entries(perTournament).map(([name, row]) => (
                        <tr key={name}><td>{name}</td><td>{row.count}</td><td>{formatPrice(row.revenue)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="toolbar">
              <h2>All tickets</h2>
              <FilterPills options={['PENDING', 'CONFIRMED', 'CANCELLED']} value={status} onChange={setStatus} />
            </div>

            {tickets.length === 0 ? (
              <EmptyState icon="🎟" title="No tickets yet" />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>#</th><th>Tournament</th><th>Seat</th><th>Price</th><th>Payment</th><th>Status</th><th>Bought</th><th></th></tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>{t.tournamentName}</td>
                        <td>{t.seatNumber}</td>
                        <td>{formatPrice(t.price)}</td>
                        <td><Badge status={t.paymentStatus} /></td>
                        <td><Badge status={t.ticketStatus} /></td>
                        <td>{formatDateTime(t.createdAt)}</td>
                        <td>
                          {t.ticketStatus !== 'CANCELLED' && (
                            <Button size="sm" variant="danger" onClick={() => setToCancel(t)}>Cancel</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {toCancel && (
        <Modal
          title="Cancel ticket?"
          onClose={() => setToCancel(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setToCancel(null)}>Back</Button>
              <Button variant="danger" size="sm" loading={saving} onClick={cancelTicket}>Yes, cancel</Button>
            </>
          }
        >
          <p>Ticket #{toCancel.id} (seat {toCancel.seatNumber}, {toCancel.tournamentName}) will be cancelled and the seat released.</p>
        </Modal>
      )}
    </>
  );
}
