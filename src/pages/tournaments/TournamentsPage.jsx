import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, EmptyState, FilterPills, PageHeader, SkeletonCards } from '../../components/ui';
import { tournamentsApi } from '../../api/endpoints';
import useApi from '../../hooks/useApi';
import images, { tournamentImages } from '../../assets/images';
import { formatDate, formatEnum, formatPrice, formatTime, TOURNAMENT_TYPES } from '../../utils/format';

// List of tournaments. Opening one shows the seat map.
export default function TournamentsPage() {
  const { data, loading, error } = useApi(tournamentsApi.list);
  const [type, setType] = useState('');
  const [showPast, setShowPast] = useState(false);

  const tournaments = (data || [])
    .filter((t) => !type || t.tournamentType === type)
    // By default only upcoming and ongoing tournaments are shown.
    .filter((t) => showPast || t.tournamentStatus === 'UPCOMING' || t.tournamentStatus === 'ONGOING')
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <PageHeader title="Tournaments" subtitle="Choose your event, then pick your seat" image={images.headerTournaments} />

      <section className="container content">
        <div className="toolbar">
          <FilterPills options={TOURNAMENT_TYPES} value={type} onChange={setType} allLabel="All types" />
          <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
            Show past and cancelled
          </label>
        </div>

        {loading && <SkeletonCards />}
        {!loading && error && <EmptyState icon="⚠️" title="Could not load tournaments" text={error.message} />}
        {!loading && !error && tournaments.length === 0 && (
          <EmptyState icon="🏆" title="No tournaments yet" text="New events are announced here. Check back soon." />
        )}

        {!loading && !error && tournaments.length > 0 && (
          <div className="card-grid">
            {tournaments.map((tournament) => (
              <Link to={`/tournaments/${tournament.id}`} key={tournament.id} className="card" style={{ textDecoration: 'none' }}>
                <div className="card-image">
                  <img src={tournamentImages[tournament.tournamentType]} alt="" loading="lazy" />
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span className="eyebrow" style={{ margin: 0 }}>{formatEnum(tournament.tournamentType)}</span>
                    <Badge status={tournament.tournamentStatus} />
                  </div>
                  <h3 style={{ marginTop: 10 }}>{tournament.name}</h3>
                  <ul className="card-meta">
                    <li><span>Date</span><span>{formatDate(tournament.date)}</span></li>
                    <li><span>Time</span><span>{formatTime(tournament.time)}</span></li>
                    <li><span>Venue</span><span>{tournament.venue}</span></li>
                    <li><span>Ticket</span><strong>{formatPrice(tournament.ticketPrice)}</strong></li>
                  </ul>
                  <span className="link-more">Choose your seat →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
