import { createContext, useContext, useState, type ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface NotificationContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSuccess = (message: string) => setState({ open: true, message, severity: 'success' });
  const showError = (message: string) => setState({ open: true, message, severity: 'error' });
  const handleClose = () => setState((prev) => ({ ...prev, open: false }));

  return (
    <NotificationContext.Provider value={{ showSuccess, showError }}>
      {children}
      <Snackbar open={state.open} autoHideDuration={5000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleClose} severity={state.severity} variant="filled" sx={{ width: '100%' }}>
          {state.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return ctx;
}
