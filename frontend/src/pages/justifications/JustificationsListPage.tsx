import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { listJustifications } from '../../api/justifications.api';
import type { JustificationStatus } from '../../types';
import { useAsync } from '../../hooks/useAsync';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { StatusChip } from '../../components/StatusChip';

const TABS: { label: string; value: JustificationStatus | 'todas' }[] = [
  { label: 'Pendientes', value: 'pendiente' },
  { label: 'Aprobadas', value: 'aprobada' },
  { label: 'Rechazadas', value: 'rechazada' },
  { label: 'Todas', value: 'todas' },
];

export function JustificationsListPage() {
  const [tab, setTab] = useState<JustificationStatus | 'todas'>('pendiente');
  const { data: justifications, loading, error, run } = useAsync(async (status?: JustificationStatus) => (await listJustifications(status)).data);
  const navigate = useNavigate();

  useEffect(() => {
    run(tab === 'todas' ? undefined : tab);
  }, [run, tab]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Justificaciones</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/justifications/new')}>
          Nueva Justificación
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        {TABS.map((t) => (
          <Tab key={t.value} label={t.label} value={t.value} />
        ))}
      </Tabs>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={() => run(tab === 'todas' ? undefined : tab)} />}

      {justifications && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Creada</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {justifications.map((j) => (
                <TableRow key={j.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/justifications/${j.id}`)}>
                  <TableCell>{j.employee ? `${j.employee.firstName} ${j.employee.lastName}` : '-'}</TableCell>
                  <TableCell>{new Date(j.justificationDate).toLocaleDateString()}</TableCell>
                  <TableCell>{j.description.length > 60 ? `${j.description.slice(0, 60)}...` : j.description}</TableCell>
                  <TableCell>
                    <StatusChip status={j.status} />
                  </TableCell>
                  <TableCell>{new Date(j.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {justifications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay justificaciones en este estado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
