import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import type { Company, Employee } from '../../types';
import type { EmployeeInput } from '../../api/employees.api';

interface EmployeeFormDialogProps {
  open: boolean;
  employee: Employee | null;
  companies: Company[];
  onClose: () => void;
  onSubmit: (input: EmployeeInput) => Promise<void>;
}

const EMPTY: EmployeeInput = {
  firstName: '',
  lastName: '',
  employeeId: '',
  email: '',
  phone: '',
  scheduledStartTime: '08:00',
  scheduledEndTime: '17:00',
  companyId: '',
};

export function EmployeeFormDialog({ open, employee, companies, onClose, onSubmit }: EmployeeFormDialogProps) {
  const [form, setForm] = useState<EmployeeInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        employee
          ? {
              firstName: employee.firstName,
              lastName: employee.lastName,
              employeeId: employee.employeeId,
              email: employee.email ?? '',
              phone: employee.phone ?? '',
              scheduledStartTime: employee.scheduledStartTime,
              scheduledEndTime: employee.scheduledEndTime,
              companyId: employee.companyId,
            }
          : { ...EMPTY, companyId: companies[0]?.id ?? '' },
      );
    }
  }, [open, employee, companies]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  const isValid = form.firstName.length >= 2 && form.lastName.length >= 2 && form.employeeId.length > 0 && form.companyId;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{employee ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          select
          label="Empresa"
          value={form.companyId}
          onChange={(e) => setForm({ ...form, companyId: e.target.value })}
          required
          fullWidth
        >
          {companies.map((company) => (
            <MenuItem key={company.id} value={company.id}>
              {company.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Nombres"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          required
          fullWidth
        />
        <TextField
          label="Apellidos"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          required
          fullWidth
        />
        <TextField
          label="ID de Empleado"
          value={form.employeeId}
          onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
          required
          fullWidth
          helperText="Debe coincidir con el código usado en el sistema biométrico"
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          fullWidth
        />
        <TextField label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
        <TextField
          label="Hora de Entrada"
          type="time"
          value={form.scheduledStartTime}
          onChange={(e) => setForm({ ...form, scheduledStartTime: e.target.value })}
          required
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Hora de Salida"
          type="time"
          value={form.scheduledEndTime}
          onChange={(e) => setForm({ ...form, scheduledEndTime: e.target.value })}
          required
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving || !isValid}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
