import { Alert, Button, Stack } from '@mui/material';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Alert
      severity="error"
      action={
        onRetry && (
          <Stack direction="row">
            <Button color="inherit" size="small" onClick={onRetry}>
              Reintentar
            </Button>
          </Stack>
        )
      }
    >
      {message}
    </Alert>
  );
}
