import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import type { Company } from '../../types';
import type { CompanyInput } from '../../api/companies.api';

interface CompanyFormDialogProps {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onSubmit: (input: CompanyInput) => Promise<void>;
}

const EMPTY: CompanyInput = { name: '', ruc: '', address: '' };

export function CompanyFormDialog({ open, company, onClose, onSubmit }: CompanyFormDialogProps) {
  const [form, setForm] = useState<CompanyInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(company ? { name: company.name, ruc: company.ruc ?? '', address: company.address ?? '' } : EMPTY);
    }
  }, [open, company]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{company ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          label="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          fullWidth
        />
        <TextField label="RUC" value={form.ruc} onChange={(e) => setForm({ ...form, ruc: e.target.value })} fullWidth />
        <TextField
          label="Dirección"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          fullWidth
          multiline
          rows={2}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving || form.name.length < 3}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
