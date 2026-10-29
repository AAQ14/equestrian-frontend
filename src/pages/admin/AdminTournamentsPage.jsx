import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { Badge, EmptyState, Modal, PageHeader, SkeletonRows } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { tournamentsApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import images from '../../assets/images';
import { formatDate, formatEnum, formatPrice, formatTime, todayIso, toApiTime, TOURNAMENT_TYPES } from '../../utils/format';

const EMPTY = {
  name: '', tournamentType: 'SHOW_JUMPING', date: '', time: '15:00', venue: '',
  description: '', numberOfSeats: 40, ticketPrice: 10,
};

// Admin: create, update and cancel tournaments.
export default function AdminTournamentsPage() {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useApi(tournamentsApi.list);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, a tournament = edit.
  const [form, setForm] = useState(EMPTY);
  const [currentSeats, setCurrentSeats] = useState(0);
  const [toCancel, setToCancel] = useState(null);
  const [saving, setSaving] = useState(false);

  const tournaments = [...(data || [])].sort((a, b) => b.date.localeCompare(a.date));
  const isEdit = Boolean(editing?.id);

  function openNew() {
    setForm(EMPTY);
    setCurrentSeats(0);
    setEditing({});
  }

  async function openEdit(tournament) {
    setForm({ ...tournament, time: tournament.time.slice(0, 5), numberOfSeats: '' });
    setEditing(tournament);
    // The tournament response has no seat count, so we count its seats.
    const seats = await tournamentsApi.seats(tournament.id).catch(() => []);
    setCurrentSeats(seats.length);
    setForm((f) => ({ ...f, numberOfSeats: seats.length }));
  }

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function save(event) {
    event.preventDefault();
    const body = {
      name: form.name,
      tournamentType: form.tournamentType,
      date: form.date,
      time: toApiTime(form.time),
      venue: form.venue,
      description: form.description,
      numberOfSeats: Number(form.numberOfSeats),
      ticketPrice: Number(form.ticketPrice),
    };
    if (isEdit && body.numberOfSeats < currentSeats) {
      showToast(`Seats can only increase (now ${currentSeats}).`, 'error');
      return;
    }
    // On update, the date must still be in the future, so we leave it out if it did not change.
    if (isEdit && body.date === editing.date) delete body.date;
    if (isEdit && body.numberOfSeats === currentSeats) delete body.numberOfSeats;

    setSaving(true);
    try {
      if (isEdit) await tournamentsApi.update(editing.id, body);
      else await tournamentsApi.create(body);
      showToast(isEdit ? 'Tournament updated.' : 'Tournament created with its seats.', 'success');
      setEditing(null);
      reload(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function cancelTournament() {
    setSaving(true);
    try {
      await tournamentsApi.cancel(toCancel.id);
      showToast('Tournament cancelled. Ticket holders were notified.', 'success');
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
      <PageHeader title="Manage tournaments" image={images.headerTournaments} />

      <section className="container content">
        <div className="toolbar">
          <h2>{tournaments.length} tournaments</h2>
          <Button size="sm" onClick={openNew}>+ New tournament</Button>
        </div>

        {loading && <SkeletonRows />}
        {!loading && error && <EmptyState icon="⚠️" title="Could not load tournaments" text={error.message} />}
        {!loading && !error && tournaments.length === 0 && (
          <EmptyState icon="🏆" title="No tournaments yet" text="Create the first one." />
        )}

        {!loading && !error && tournaments.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Type</th><th>Date</th><th>Venue</th><th>Price</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td><strong>{t.name}</strong></td>
                    <td>{formatEnum(t.tournamentType)}</td>
                    <td>{formatDate(t.date)}, {formatTime(t.time)}</td>
                    <td>{t.venue}</td>
                    <td>{formatPrice(t.ticketPrice)}</td>
                    <td><Badge status={t.tournamentStatus} /></td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/tournaments/${t.id}`} className="btn btn-outline btn-sm">Seats</Link>
                        {t.tournamentStatus === 'UPCOMING' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openEdit(t)}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => setToCancel(t)}>Cancel</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <Modal
          title={isEdit ? `Edit ${editing.name}` : 'New tournament'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button size="sm" type="submit" form="tournament-form" loading={saving}>Save</Button>
            </>
          }
        >
          <form id="tournament-form" onSubmit={save}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" value={form.name} onChange={change} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tournamentType">Type</label>
                <select id="tournamentType" name="tournamentType" value={form.tournamentType} onChange={change}>
                  {TOURNAMENT_TYPES.map((t) => <option key={t} value={t}>{formatEnum(t)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="venue">Venue</label>
                <input id="venue" name="venue" value={form.venue} onChange={change} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input id="date" name="date" type="date" min={todayIso()} value={form.date} onChange={change} required />
              </div>
              <div className="form-group">
                <label htmlFor="time">Time</label>
                <input id="time" name="time" type="time" value={form.time} onChange={change} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="numberOfSeats">Seats</label>
                <input id="numberOfSeats" name="numberOfSeats" type="number" min={Math.max(1, currentSeats)} value={form.numberOfSeats} onChange={change} required />
                {isEdit && <span className="field-hint">Can only increase (now {currentSeats}).</span>}
              </div>
              <div className="form-group">
                <label htmlFor="ticketPrice">Ticket price (BHD)</label>
                <input id="ticketPrice" name="ticketPrice" type="number" min="0.5" step="0.5" value={form.ticketPrice} onChange={change} required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows="3" value={form.description} onChange={change} required />
            </div>
          </form>
        </Modal>
      )}

      {toCancel && (
        <Modal
          title="Cancel tournament?"
          onClose={() => setToCancel(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setToCancel(null)}>Keep it</Button>
              <Button variant="danger" size="sm" loading={saving} onClick={cancelTournament}>Yes, cancel</Button>
            </>
          }
        >
          <p><strong>{toCancel.name}</strong> will be cancelled and everyone with a ticket will be notified.</p>
        </Modal>
      )}
    </>
  );
}
