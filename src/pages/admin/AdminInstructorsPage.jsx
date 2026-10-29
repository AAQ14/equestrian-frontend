import { useState } from 'react';
import Button from '../../components/Button';
import { EmptyState, Modal, PageHeader, SkeletonRows } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { instructorsApi, usersApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import images from '../../assets/images';
import { formatEnum, SKILL_LEVELS, SPECIALIZATIONS } from '../../utils/format';

const EMPTY = { userId: '', specialization: 'GENERAL', experienceYears: 1, skillLevel: 'INTERMEDIATE' };

// Admin: instructor profiles. Adding one turns an existing user into an INSTRUCTOR.
export default function AdminInstructorsPage() {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useApi(async () => {
    const [instructors, users] = await Promise.all([instructorsApi.list(), usersApi.list('ACTIVE')]);
    return { instructors, users };
  });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const instructors = data?.instructors || [];
  const clients = (data?.users || []).filter((u) => u.role === 'CLIENT'); // Users who can become instructors.
  const isEdit = Boolean(editing?.id);

  function open(instructor) {
    // The update API needs the userId, which the instructor response does not include,
    // so we look up the user with the same name and fill it in.
    const user = instructor
      ? (data?.users || []).find((u) => u.firstName === instructor.firstName && u.lastName === instructor.lastName)
      : null;
    setForm(instructor ? { ...instructor, userId: user?.id || '' } : EMPTY);
    setEditing(instructor || {});
  }

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function save(event) {
    event.preventDefault();
    const body = {
      userId: Number(form.userId) || undefined,
      specialization: form.specialization,
      experienceYears: Number(form.experienceYears),
      skillLevel: form.skillLevel,
    };
    setSaving(true);
    try {
      if (isEdit) await instructorsApi.update(editing.id, body);
      else await instructorsApi.create(body);
      showToast(isEdit ? 'Instructor updated.' : 'Instructor added.', 'success');
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
      await instructorsApi.remove(toDelete.id);
      showToast('Instructor profile removed. The user is a client again.', 'success');
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
      <PageHeader title="Instructors" image={images.headerAdmin} />

      <section className="container content">
        <div className="toolbar">
          <h2>{instructors.length} instructors</h2>
          <Button size="sm" onClick={() => open(null)}>+ Add instructor</Button>
        </div>

        {loading && <SkeletonRows />}
        {!loading && error && <EmptyState icon="⚠️" title="Could not load instructors" text={error.message} />}
        {!loading && !error && instructors.length === 0 && <EmptyState title="No instructors yet" />}

        {!loading && !error && instructors.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Specialization</th><th>Experience</th><th>Level</th><th></th></tr>
              </thead>
              <tbody>
                {instructors.map((i) => (
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td><strong>{i.firstName} {i.lastName}</strong></td>
                    <td>{formatEnum(i.specialization)}</td>
                    <td>{i.experienceYears} years</td>
                    <td>{formatEnum(i.skillLevel)}</td>
                    <td>
                      <div className="table-actions">
                        <Button size="sm" variant="outline" onClick={() => open(i)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => setToDelete(i)}>Remove</Button>
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
          title={isEdit ? `Edit ${editing.firstName}` : 'Add instructor'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button size="sm" type="submit" form="instructor-form" loading={saving}>Save</Button>
            </>
          }
        >
          <form id="instructor-form" onSubmit={save}>
            {!isEdit && (
              <div className="form-group">
                <label htmlFor="userId">User</label>
                <select id="userId" name="userId" value={form.userId} onChange={change} required>
                  <option value="">Choose an active client…</option>
                  {clients.map((u) => (
                    <option key={u.id} value={u.id}>#{u.id} {u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
            )}
            {isEdit && (
              <div className="form-group">
                <label htmlFor="userId">User ID (required by the API)</label>
                <input id="userId" name="userId" type="number" min="1" value={form.userId} onChange={change} required />
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="specialization">Specialization</label>
                <select id="specialization" name="specialization" value={form.specialization} onChange={change}>
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="experienceYears">Experience (years)</label>
                <input id="experienceYears" name="experienceYears" type="number" min="0" value={form.experienceYears} onChange={change} required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="skillLevel">Teaches level</label>
              <select id="skillLevel" name="skillLevel" value={form.skillLevel} onChange={change}>
                {SKILL_LEVELS.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <Modal
          title="Remove instructor?"
          onClose={() => setToDelete(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setToDelete(null)}>Back</Button>
              <Button variant="danger" size="sm" loading={saving} onClick={remove}>Remove</Button>
            </>
          }
        >
          <p>
            The instructor profile of <strong>{toDelete.firstName} {toDelete.lastName}</strong> will be removed. Their user
            account stays and becomes a client again.
          </p>
        </Modal>
      )}
    </>
  );
}
