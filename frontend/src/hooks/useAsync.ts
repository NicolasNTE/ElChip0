import { useCallback, useRef, useState } from 'react';
import { getApiErrorMessage } from '../utils/apiError';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<Args extends unknown[], T>(fn: (...args: Args) => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: false, error: null });

  // Keep the latest fn in a ref so `run` has a stable identity across renders.
  // Without this, an inline `fn` passed at each call site would give `run` a new
  // identity every render, re-triggering any `useEffect(() => run(), [run])`
  // callers on every render and causing an infinite render loop.
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async (...args: Args) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fnRef.current(...args);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const message = getApiErrorMessage(err);
      setState({ data: null, loading: false, error: message });
      throw err;
    }
  }, []);

  return { ...state, run };
}
