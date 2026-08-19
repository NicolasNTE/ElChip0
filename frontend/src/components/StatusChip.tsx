import { Chip } from '@mui/material';
import type { JustificationStatus } from '../types';

const CONFIG: Record<JustificationStatus, { label: string; color: 'warning' | 'success' | 'error' }> = {
  pendiente: { label: 'Pendiente', color: 'warning' },
  aprobada: { label: 'Aprobada', color: 'success' },
  rechazada: { label: 'Rechazada', color: 'error' },
};

export function StatusChip({ status }: { status: JustificationStatus }) {
  const { label, color } = CONFIG[status];
  return <Chip label={label} color={color} size="small" />;
}
