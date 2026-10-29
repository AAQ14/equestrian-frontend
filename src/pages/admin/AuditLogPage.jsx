import { useState } from 'react';
import { EmptyState, PageHeader, SkeletonRows } from '../../components/ui';
import { auditLogsApi } from '../../api/endpoints';
import useApi from '../../hooks/useApi';
import images from '../../assets/images';
import { formatDateTime, formatEnum } from '../../utils/format';

const PAGE_SIZE = 25;

// Admin: who did what and when (newest first), with a filter and simple paging.
export default function AuditLogPage() {
  const { data, loading, error, reload } = useApi(auditLogsApi.list);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const logs = data || [];
  const actions = [...new Set(logs.map((l) => l.auditAction))].sort(); // Only actions that exist.
  const term = search.trim().toLowerCase();

  const filtered = logs
    .filter((l) => !action || l.auditAction === action)
    .filter((l) => !term || `${l.description} ${l.entityType} ${l.userId}`.toLowerCase().includes(term))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // Newest first.

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Any filter change goes back to page 1.
  const onFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Audit log" subtitle="Every important action, recorded" image={images.headerAdmin} />

      <section className="container content">
        <div className="filters">
          <div className="form-group">
            <label htmlFor="action">Action</label>
            <select id="action" value={action} onChange={onFilter(setAction)}>
              <option value="">All actions</option>
              {actions.map((a) => <option key={a} value={a}>{formatEnum(a)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="search">Search</label>
            <input id="search" placeholder="Description, entity, user id" value={search} onChange={onFilter(setSearch)} />
          </div>
          <button className="pill" onClick={() => reload()}>↻ Refresh</button>
        </div>

        {loading && <SkeletonRows count={8} />}
        {!loading && error && <EmptyState icon="⚠️" title="Could not load the audit log" text={error.message} />}
        {!loading && !error && filtered.length === 0 && <EmptyState icon="📜" title="No log entries" />}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>#</th><th>When</th><th>User</th><th>Action</th><th>Entity</th><th>Description</th></tr>
                </thead>
                <tbody>
                  {visible.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                      <td>{log.userId ? `#${log.userId}` : '—'}</td>
                      <td><code>{log.auditAction}</code></td>
                      <td>{log.entityType} {log.entityId ? `#${log.entityId}` : ''}</td>
                      <td>{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="toolbar" style={{ marginTop: 20, marginBottom: 0 }}>
              <span className="muted">{filtered.length} entries · page {page} of {pages}</span>
              <div className="filter-pills">
                <button className="pill" disabled={page === 1} onClick={() => setPage(page - 1)}>← Newer</button>
                <button className="pill" disabled={page === pages} onClick={() => setPage(page + 1)}>Older →</button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
