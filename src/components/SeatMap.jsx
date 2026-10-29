import { formatPrice } from '../utils/format';
import './SeatMap.css';

// How many seats go in one row, based on the total, so small and big arenas both look good.
export function seatsPerRow(total) {
  if (total <= 30) return 10;
  if (total <= 90) return 14;
  return 18;
}

// Row letter of a seat: seats 1-10 are row A, 11-20 row B... (for 10 per row).
export function rowLetter(seatNumber, perRow) {
  return String.fromCharCode(65 + Math.floor((seatNumber - 1) / perRow));
}

// Cinema-style seat icon (seat back + cushion + arms), drawn with SVG.
function SeatIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="seat-svg">
      <path d="M8 4h16a3 3 0 0 1 3 3v11H5V7a3 3 0 0 1 3-3z" />
      <rect x="3" y="17" width="26" height="7" rx="2" />
      <rect x="5" y="24" width="3" height="5" rx="1" />
      <rect x="24" y="24" width="3" height="5" rx="1" />
    </svg>
  );
}

// Shows all seats of a tournament like a cinema seat map.
// seats: [{ id, seatNumber, seatStatus, price }]
// selectedId: the seat the user clicked. ownSeatId: the user's current seat when changing seat.
export default function SeatMap({ seats, selectedId, ownSeatId, onSelect, disabled }) {
  const sorted = [...seats].sort((a, b) => a.seatNumber - b.seatNumber);
  const perRow = seatsPerRow(sorted.length);
  const half = Math.ceil(perRow / 2); // Where the middle aisle goes.

  // Split the seats into rows of "perRow" seats.
  const rows = [];
  for (let i = 0; i < sorted.length; i += perRow) {
    const row = sorted.slice(i, i + perRow);
    // Fill a short last row with empty places, so its seats line up with the rows above.
    while (row.length < perRow) row.push(null);
    rows.push(row);
  }

  function stateOf(seat) {
    if (seat.id === ownSeatId) return 'own';
    if (seat.id === selectedId) return 'selected';
    return seat.seatStatus === 'SOLD' ? 'sold' : 'available';
  }

  function renderSeat(seat, index) {
    if (!seat) return <span key={`empty-${index}`} className="seat-empty" />;
    const state = stateOf(seat);
    const row = rowLetter(seat.seatNumber, perRow);
    const clickable = state === 'available' || state === 'selected';
    return (
      <button
        key={seat.id}
        type="button"
        className={`seat seat-${state}`}
        disabled={disabled || !clickable}
        onClick={() => onSelect(seat)}
        aria-pressed={state === 'selected'}
        aria-label={`Row ${row}, seat ${seat.seatNumber}, ${state === 'own' ? 'your current seat' : state}, ${formatPrice(seat.price)}`}
        title={`Row ${row} · Seat ${seat.seatNumber} · ${formatPrice(seat.price)}`}
      >
        <SeatIcon />
        <span className="seat-number">{seat.seatNumber}</span>
      </button>
    );
  }

  return (
    <div className="seatmap">
      {/* The arena is drawn at the top, like the screen in a cinema. */}
      <div className="arena" aria-hidden="true">
        <span>Arena</span>
      </div>

      <div className="seat-rows" role="group" aria-label="Seat map">
        {rows.map((row, index) => {
          const letter = String.fromCharCode(65 + index);
          return (
            <div className="seat-row" key={letter} style={{ animationDelay: `${index * 0.05}s` }}>
              <span className="row-label">{letter}</span>
              <div className="seat-block">{row.slice(0, half).map(renderSeat)}</div>
              <div className="aisle" />
              <div className="seat-block">{row.slice(half).map(renderSeat)}</div>
              <span className="row-label">{letter}</span>
            </div>
          );
        })}
      </div>

      <ul className="seat-legend">
        <li><span className="legend-box seat-available" /> Available</li>
        <li><span className="legend-box seat-selected" /> Selected</li>
        <li><span className="legend-box seat-sold" /> Sold</li>
        {ownSeatId && <li><span className="legend-box seat-own" /> Your seat</li>}
      </ul>
    </div>
  );
}
