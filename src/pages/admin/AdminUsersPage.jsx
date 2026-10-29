import { useState } from 'react';
import Button from '../../components/Button';
import { Badge, EmptyState, FilterPills, PageHeader, SkeletonRows } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usersApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/axiosInstance';
import useApi from '../../hooks/useApi';
import images from '../../assets/images';
import { formatDateTime, formatEnum, USER_STATUSES } from '../../utils/format';

// Admin: list users and activate / deactivate them.
export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const { data, loading, error, reload } = useApi(() => usersApi.list(status), [status]);

  const term = search.trim().toLowerCase();
  const users = (data || [])
    .filter((u) => !term || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(term))
    .sort((a, b) => a.id - b.id);

  async function toggle(user) {
    setBusyId(user.id);
    try {
      if (user.userStatus === 'ACTIVE') await usersApi.deactivate(user.id);
      else await usersApi.activate(user.id);
      showToast(`${user.firstName} is now ${user.userStatus === 'ACTIVE' ? 'inactive' : 'active'}.`, 'success');
      reload(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Users" image={images.headerAdmin} />

      <section className="container content">
        <div className="filters">
          <div className="form-group">
            <label htmlFor="search">Search</label>
            <input id="search" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <FilterPills options={USER_STATUSES} value={status} onChange={setStatus} />
        </div>

        {loading && <SkeletonRows />}
        {!loading && error && <EmptyState icon="⚠️" title="Could not load users" text={error.message} />}
        {!loading && !error && users.length === 0 && <EmptyState icon="👤" title="No users found" />}

        {!loading && !error && users.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td><strong>{u.firstName} {u.lastName}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{formatEnum(u.role)}</td>
                    <td><Badge status={u.userStatus} /></td>
                    <td>{formatDateTime(u.createdAt)}</td>
                    <td>
                      {/* An admin cannot deactivate their own account. */}
                      {u.email !== me.email && (
                        <Button
                          size="sm"
                          variant={u.userStatus === 'ACTIVE' ? 'danger' : 'primary'}
                          loading={busyId === u.id}
                          onClick={() => toggle(u)}
                        >
                          {u.userStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
