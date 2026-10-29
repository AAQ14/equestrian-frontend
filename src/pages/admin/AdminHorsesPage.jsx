import { useState } from 'react';
import Button from '../../components/Button';
import { Badge, EmptyState, Modal, PageHeader, SkeletonCards } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { horsesApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import images, { horseFallbackImages } from '../../assets/images';
import { formatEnum, GENDERS, HORSE_STATUSES, SKILL_LEVELS } from '../../utils/format';

const EMPTY = { name: '', breed: '', age: 8, gender: 'MARE', horseStatus: 'AVAILABLE', skillLevel: 'BEGINNER' };

// Admin: horses as photo cards, with create, edit and delete.
export default function AdminHorsesPage() {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useApi(horsesApi.list);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, a horse = edit.
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const horses = [...(data || [])].sort((a, b) => a.id - b.id);
  const isEdit = Boolean(editing?.id);

  function open(horse) {
    setForm(horse ? { ...horse } : EMPTY);
    setFile(null);
    setEditing(horse || {});
  }

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function save(event) {
    event.preventDefault();
    // The backend reads horses as form fields (@ModelAttribute), so we send FormData, not JSON.
    const formData = new FormData();
    ['name', 'breed', 'age', 'gender', 'horseStatus', 'skillLevel'].forEach((key) => formData.append(key, form[key]));
    if (file) formData.append('image', file);

    setSaving(true);
    try {
      if (isEdit) await horsesApi.update(editing.id, formData);
      else await horsesApi.create(formData);
      showToast(isEdit ? 'Horse updated.' : 'Horse added.', 'success');
      setEditing(null);
      reload(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await horsesApi.remove(toDelete.id);
      showToast(`${toDelete.name} was removed.`, 'success');
      setToDelete(null);
      reload(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Horses" subtitle="Our stable" image={images.headerAdmin} />

      <section className="container content">
        <div className="toolbar">
          <h2>{horses.length} horses</h2>
          <Button size="sm" onClick={() => open(null)}>+ Add horse</Button>
        </div>

        {loading && <SkeletonCards />}
        {!loading && error && <EmptyState icon="⚠️" title="Could not load horses" text={error.message} />}
        {!loading && !error && horses.length === 0 && <EmptyState title="No horses yet" text="Add the first horse." />}

        {!loading && !error && horses.length > 0 && (
          <div className="card-grid">
            {horses.map((horse) => (
              <article key={horse.id} className="card">
                <div className="card-image">
                  {/* Uploaded images are not served by the backend yet, so we show a stock photo. */}
                  <img src={horseFallbackImages[horse.id % horseFallbackImages.length]} alt="" loading="lazy" />
                </div>
                <div className="card-body">
                  <Badge status={horse.horseStatus} />
                  <h3 style={{ marginTop: 10 }}>{horse.name}</h3>
                  <ul className="card-meta">
                    <li><span>Breed</span><span>{horse.breed}</span></li>
                    <li><span>Age</span><span>{horse.age} years</span></li>
                    <li><span>Gender</span><span>{formatEnum(horse.gender)}</span></li>
                    <li><span>Level</span><span>{formatEnum(horse.skillLevel)}</span></li>
                  </ul>
                  <div className="card-actions">
                    <Button size="sm" variant="outline" onClick={() => open(horse)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => setToDelete(horse)}>Delete</Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <Modal
          title={isEdit ? `Edit ${editing.name}` : 'Add horse'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button size="sm" type="submit" form="horse-form" loading={saving}>Save</Button>
            </>
          }
        >
          <form id="horse-form" onSubmit={save}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" value={form.name} onChange={change} required />
              </div>
              <div className="form-group">
                <label htmlFor="breed">Breed</label>
                <input id="breed" name="breed" value={form.breed} onChange={change} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input id="age" name="age" type="number" min="0" max="65" value={form.age} onChange={change} required />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" value={form.gender} onChange={change}>
                  {GENDERS.map((g) => <option key={g} value={g}>{formatEnum(g)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="horseStatus">Status</label>
                <select id="horseStatus" name="horseStatus" value={form.horseStatus} onChange={change}>
                  {HORSE_STATUSES.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="skillLevel">Skill level</label>
                <select id="skillLevel" name="skillLevel" value={form.skillLevel} onChange={change}>
                  {SKILL_LEVELS.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="image">Photo (optional, JPEG/PNG/WebP, max 2 MB)</label>
              <input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} />
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <Modal
          title="Delete horse?"
          onClose={() => setToDelete(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setToDelete(null)}>Back</Button>
              <Button variant="danger" size="sm" loading={saving} onClick={remove}>Delete</Button>
            </>
          }
        >
          <p><strong>{toDelete.name}</strong> will be removed from the stable.</p>
        </Modal>
      )}
    </>
  );
}
