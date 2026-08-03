import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
      <Typography variant="h2">404</Typography>
      <Typography variant="body1">Página no encontrada</Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Volver al Dashboard
      </Button>
    </Box>
  );
}
