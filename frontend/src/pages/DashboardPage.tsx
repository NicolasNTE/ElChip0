import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import { getJustificationStatistics } from '../api/justifications.api';
import { useAsync } from '../hooks/useAsync';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

const STAT_CARDS = [
  { key: 'total' as const, label: 'Total Justificaciones', color: 'primary.main' },
  { key: 'pending' as const, label: 'Pendientes', color: 'warning.main' },
  { key: 'approved' as const, label: 'Aprobadas', color: 'success.main' },
  { key: 'rejected' as const, label: 'Rechazadas', color: 'error.main' },
];

const QUICK_LINKS = [
  { label: 'Importar Excel de Asistencia', path: '/attendance/import' },
  { label: 'Justificaciones Pendientes', path: '/justifications' },
  { label: 'Reporte de Nómina', path: '/reports/payroll' },
  { label: 'Gestionar Empresas', path: '/companies' },
  { label: 'Gestionar Empleados', path: '/employees' },
];

export function DashboardPage() {
  const { data: stats, loading, error, run } = useAsync(async () => (await getJustificationStatistics()).data);
  const navigate = useNavigate();

  useEffect(() => {
    run();
  }, [run]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={() => run()} />}

      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {STAT_CARDS.map((card) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.key}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                  <Typography variant="h3" sx={{ color: card.color }}>
                    {stats[card.key]}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h6" gutterBottom>
        Accesos rápidos
      </Typography>
      <Grid container spacing={2}>
        {QUICK_LINKS.map((link) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={link.path}>
            <Card>
              <CardActionArea onClick={() => navigate(link.path)}>
                <CardContent>
                  <Typography variant="subtitle1">{link.label}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
