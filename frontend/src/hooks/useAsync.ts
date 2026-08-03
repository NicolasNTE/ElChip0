import { useCallback, useState } from 'react';
import { getApiErrorMessage } from '../utils/apiError';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<Args extends unknown[], T>(fn: (...args: Args) => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: false, error: null });

  const run = useCallback(
    async (...args: Args) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await fn(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const message = getApiErrorMessage(err);
        setState({ data: null, loading: false, error: message });
        throw err;
      }
    },
    [fn],
  );

  return { ...state, run };
}
