import { useState } from 'react';
import Button from './Button';
import { Modal, Spinner } from './ui';
import { useToast } from '../context/ToastContext';
import { horseAssignmentApi, horsesApi } from '../api/endpoints';
import { getErrorMessage } from '../api/axiosInstance';
import useApi from '../hooks/useApi';
import { horseFallbackImages } from '../assets/images';
import { formatEnum } from '../utils/format';
import './HorseAssignmentModal.css';

// Dialog to assign, change or remove the horse of one booking.
// Used by clients (My bookings) and instructors (Bookings).
export default function HorseAssignmentModal({ booking, onClose }) {
  const { showToast } = useToast();
  const [chosenHorseId, setChosenHorseId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Current assignment (or null) and all horses, loaded together.
  const { data, loading, reload } = useApi(async () => {
    const [assignment, horses] = await Promise.all([horseAssignmentApi.get(booking.id), horsesApi.list()]);
    return { assignment, horses };
  });

  const assignment = data?.assignment;
  const horses = data?.horses || [];
  const currentHorse = assignment && horses.find((h) => h.id === assignment.horseId);
  // Only AVAILABLE horses can be chosen; the current one is hidden from the list.
  const choices = horses.filter((h) => h.horseStatus === 'AVAILABLE' && h.id !== assignment?.horseId);

  async function save(action, successMessage) {
    setSaving(true);
    try {
      await action();
      showToast(successMessage, 'success');
      setChosenHorseId(null);
      reload(true);
    } catch (error) {
      // 409 = the horse is already busy in another session at that time.
      const message =
        error.response?.status === 409 ? `${getErrorMessage(error)} Please pick another horse.` : getErrorMessage(error);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const assign = () => save(() => horseAssignmentApi.assign(booking.id, chosenHorseId), 'Horse assigned!');
  const change = () => save(() => horseAssignmentApi.change(booking.id, chosenHorseId), 'Horse changed!');
  const remove = () => save(() => horseAssignmentApi.remove(booking.id), 'Horse removed.');

  const imageOf = (horse) => horseFallbackImages[horse.id % horseFallbackImages.length];

  return (
    <Modal
      title={`Horse for booking #${booking.id}`}
      onClose={onClose}
      footer={
        <>
          {assignment && (
            <Button variant="outline" size="sm" loading={saving} onClick={remove}>
              Remove horse
            </Button>
          )}
          <Button size="sm" loading={saving} disabled={!chosenHorseId} onClick={assignment ? change : assign}>
            {assignment ? 'Change horse' : 'Assign horse'}
          </Button>
        </>
      }
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          <p className="eyebrow">Current horse</p>
          {currentHorse ? (
            <div className="horse-current">
              <img src={imageOf(currentHorse)} alt="" />
              <div>
                <strong>{currentHorse.name}</strong>
                <p className="muted">{currentHorse.breed} · {formatEnum(currentHorse.skillLevel)}</p>
              </div>
            </div>
          ) : (
            <p className="muted">No horse assigned yet.</p>
          )}

          <p className="eyebrow" style={{ marginTop: 24 }}>
            {assignment ? 'Change to' : 'Choose a horse'}
          </p>
          {choices.length === 0 ? (
            <p className="muted">No other horses are available.</p>
          ) : (
            <div className="horse-options" role="radiogroup" aria-label="Horses">
              {choices.map((horse) => (
                <button
                  key={horse.id}
                  role="radio"
                  aria-checked={chosenHorseId === horse.id}
                  className={`horse-option ${chosenHorseId === horse.id ? 'selected' : ''}`}
                  onClick={() => setChosenHorseId(horse.id)}
                >
                  <img src={imageOf(horse)} alt="" />
                  <span className="horse-name">{horse.name}</span>
                  <span className="horse-info">{formatEnum(horse.skillLevel)}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
