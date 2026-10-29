import { useState } from 'react';
import Button from '../../components/Button';
import { Modal } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { sessionsApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import { formatEnum, SKILL_LEVELS, todayIso, toApiTime } from '../../utils/format';

// Create a new session, or edit one when "session" is given.
export default function SessionFormModal({ session, instructorId, onClose, onSaved }) {
  const { showToast } = useToast();
  const isEdit = Boolean(session);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: session?.date || '',
    startTime: session?.startTime?.slice(0, 5) || '09:00',
    endTime: session?.endTime?.slice(0, 5) || '10:00',
    price: session?.price ?? 25,
    skillLevel: session?.skillLevel || 'BEGINNER',
    capacity: session?.capacity ?? 4,
  });

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.endTime <= form.startTime) {
      showToast('End time must be after start time.', 'error');
      return;
    }
    const body = {
      instructorId,
      date: form.date,
      startTime: toApiTime(form.startTime),
      endTime: toApiTime(form.endTime),
      price: Number(form.price),
      skillLevel: form.skillLevel,
      capacity: Number(form.capacity),
    };
    setSaving(true);
    try {
      if (isEdit) await sessionsApi.update(session.id, body);
      else await sessionsApi.create(body);
      showToast(isEdit ? 'Session updated.' : 'Session created.', 'success');
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? `Edit session #${session.id}` : 'New session'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" form="session-form" loading={saving}>Save</Button>
        </>
      }
    >
      <form id="session-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input id="date" name="date" type="date" min={todayIso()} value={form.date} onChange={change} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startTime">Start</label>
            <input id="startTime" name="startTime" type="time" value={form.startTime} onChange={change} required />
          </div>
          <div className="form-group">
            <label htmlFor="endTime">End</label>
            <input id="endTime" name="endTime" type="time" value={form.endTime} onChange={change} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price (BHD)</label>
            <input id="price" name="price" type="number" min="0" step="0.5" value={form.price} onChange={change} required />
          </div>
          <div className="form-group">
            <label htmlFor="capacity">Capacity (1 = private)</label>
            <input id="capacity" name="capacity" type="number" min="1" max="10" value={form.capacity} onChange={change} required />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="skillLevel">Skill level</label>
          <select id="skillLevel" name="skillLevel" value={form.skillLevel} onChange={change}>
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level}>{formatEnum(level)}</option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
