import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Run an async loader whenever `key` changes. `loading` is derived (no result
 * for the current key yet), so the effect never sets state synchronously.
 */
export function useQuery<T>(key: string, load: () => Promise<T>) {
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null);
  const [version, setVersion] = useState(0);
  const run = useEffectEvent(load);

  useEffect(() => {
    let cancelled = false;
    run()
      .then((data) => {
        if (!cancelled) setResult({ key, data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({ key, error: err instanceof Error ? err.message : 'Something went wrong.' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, version]);

  const current = result && result.key === key ? result : null;
  return {
    data: current?.data,
    error: current?.error ?? '',
    loading: !current,
    reload: () => setVersion((v) => v + 1),
  };
}
