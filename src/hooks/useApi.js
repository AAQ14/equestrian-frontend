import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../api/axiosInstance';

// Loads data when the page opens and gives back { data, loading, error, reload }.
// Example: const { data: sessions, loading } = useApi(sessionsApi.list);
// deps: when one of these values changes, the data is loaded again (like a filter).
export default function useApi(fetchFunction, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useCallback keeps the same reload function between renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); // silent = refresh in the background, no skeleton.
    setError(null);
    try {
      setData(await fetchFunction());
    } catch (err) {
      setError({ status: err.response?.status, message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
