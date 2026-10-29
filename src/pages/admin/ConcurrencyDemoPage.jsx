import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import { EmptyState, PageHeader } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { ticketsApi, tournamentsApi } from '../../api/endpoints';
import { login } from '../../api/authApi';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import images from '../../assets/images';
import { formatDate } from '../../utils/format';
import './ConcurrencyDemoPage.css';

// Seeded accounts from DataSeeder.java (password Password123!). All of them may buy tickets.
const DEMO_USERS = [
  'sara@equestrian.com',
  'khalid@equestrian.com',
  'noor@equestrian.com',
  'layla@equestrian.com',
  'omar@equestrian.com',
];
const PASSWORD = 'Password123!';

// The backend allows only a few logins per email per minute (429 after that),
// so the 5 tokens are kept here and reused when the demo runs again.
let cachedTokens = null;

// Presentation page: 5 users try to buy the SAME seat at the SAME moment.
// Thanks to the pessimistic lock on the backend, exactly one gets 201 and the others get 409.
export default function ConcurrencyDemoPage() {
  const { showToast } = useToast();
  const { data: tournaments } = useApi(tournamentsApi.list);
  const [tournamentId, setTournamentId] = useState('');
  const [seats, setSeats] = useState([]);
  const [seatId, setSeatId] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | login | racing | done
  const [results, setResults] = useState([]);

  const openTournaments = (tournaments || []).filter((t) => t.tournamentStatus === 'UPCOMING');

  // Load the free seats whenever another tournament is chosen.
  useEffect(() => {
    setSeatId('');
    if (!tournamentId) return;
    tournamentsApi.seats(tournamentId).then((list) => {
      const free = list.filter((s) => s.seatStatus === 'AVAILABLE').sort((a, b) => a.seatNumber - b.seatNumber);
      setSeats(free);
      if (free.length) setSeatId(String(free[0].id));
    });
  }, [tournamentId, phase]); // phase: reload free seats after a run.

  async function runDemo() {
    setResults([]);
    try {
      // Step 1: log in the 5 users (in parallel) to get 5 different tokens.
      setPhase('login');
      if (!cachedTokens) {
        cachedTokens = await Promise.all(DEMO_USERS.map((email) => login(email, PASSWORD).then((r) => r.token)));
      }
      const tokens = cachedTokens;

      // Step 2: fire 5 purchase requests for the same seat at the same time.
      setPhase('racing');
      const startAll = performance.now();
      const outcomes = await Promise.all(
        DEMO_USERS.map(async (email, index) => {
          const start = performance.now();
          try {
            const ticket = await ticketsApi.buy(tournamentId, Number(seatId), {
              headers: { Authorization: `Bearer ${tokens[index]}` }, // This user's own token.
            });
            return { email, status: 201, ms: performance.now() - start, message: `Ticket #${ticket.id}`, ticket };
          } catch (error) {
            return { email, status: error.response?.status || 'ERR', ms: performance.now() - start, message: getErrorMessage(error) };
          }
        })
      );
      setResults(outcomes.map((o) => ({ ...o, startedAt: startAll })));
      setPhase('done');
    } catch (error) {
      cachedTokens = null; // Log in again next time.
      showToast(getErrorMessage(error), 'error');
      setPhase('idle');
    }
  }

  // Cancel the winning ticket, so the same seat can be used for the demo again.
  async function resetSeat() {
    const winner = results.find((r) => r.status === 201);
    if (!winner) return;
    try {
      await ticketsApi.cancelAsAdmin(winner.ticket.id);
      showToast('Seat released. You can run the demo again.', 'success');
      setResults([]);
      setPhase('idle');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    }
  }

  const successCount = results.filter((r) => r.status === 201).length;
  const conflictCount = results.filter((r) => r.status === 409).length;
  const slowest = Math.max(1, ...results.map((r) => r.ms));
  const busy = phase === 'login' || phase === 'racing';

  return (
    <>
      <PageHeader title="Concurrency demo" subtitle="Five riders, one seat" image={images.heroWhite} />

      <section className="container content">
        <div className="demo-intro">
          <p>
            Five users press <em>Buy</em> on the same seat at exactly the same time. The server locks the seat row
            (<code>PESSIMISTIC_WRITE</code>), so the requests wait in line: the first one buys the seat (<strong>201</strong>),
            the others find it already sold (<strong>409 Conflict</strong>).
          </p>
        </div>

        {openTournaments.length === 0 ? (
          <EmptyState icon="🏆" title="No upcoming tournaments" text="Create a tournament first, then come back." />
        ) : (
          <div className="filters">
            <div className="form-group">
              <label htmlFor="tournament">Tournament</label>
              <select id="tournament" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
                <option value="">Choose…</option>
                {openTournaments.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} · {formatDate(t.date)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="seat">Seat</label>
              <select id="seat" value={seatId} onChange={(e) => setSeatId(e.target.value)} disabled={!seats.length}>
                {seats.length === 0 && <option value="">No free seats</option>}
                {seats.map((s) => <option key={s.id} value={s.id}>Seat {s.seatNumber}</option>)}
              </select>
            </div>
            <Button loading={busy} disabled={!seatId} onClick={runDemo}>
              {phase === 'login' ? 'Logging in 5 users…' : phase === 'racing' ? 'Buying…' : 'Buy the same seat with 5 users at once'}
            </Button>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className={`demo-verdict ${successCount === 1 ? 'ok' : 'bad'}`}>
              {successCount === 1
                ? `✓ Exactly one purchase succeeded and ${conflictCount} got 409. The lock works!`
                : `✗ ${successCount} purchases succeeded. The seat was sold more than once!`}
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>User</th><th>HTTP status</th><th>Time</th><th style={{ width: '35%' }}>Response time</th><th>Result</th></tr>
                </thead>
                <tbody>
                  {results.map((r, index) => (
                    <tr key={r.email} className={r.status === 201 ? 'demo-winner' : ''}>
                      <td>{r.email}</td>
                      <td>
                        <span className={`badge ${r.status === 201 ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
                      </td>
                      <td>{Math.round(r.ms)} ms</td>
                      <td>
                        {/* Bar length shows how long each request waited for the lock. */}
                        <div className="race-lane">
                          <div
                            className={`race-bar ${r.status === 201 ? 'win' : ''}`}
                            style={{ width: `${(r.ms / slowest) * 100}%`, animationDelay: `${index * 0.08}s` }}
                          />
                        </div>
                      </td>
                      <td>{r.status === 201 ? `🏆 ${r.message}` : r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {successCount === 1 && (
              <div style={{ marginTop: 20 }}>
                <Button variant="outline" size="sm" onClick={resetSeat}>Release the seat and reset</Button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
