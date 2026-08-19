import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { createJustification } from '../../api/justifications.api';
import { listEmployees } from '../../api/employees.api';
import type { Employee } from '../../types';
import { useAsync } from '../../hooks/useAsync';
import { EmployeeAutocomplete } from '../../components/EmployeeAutocomplete';
import { useNotification } from '../../context/NotificationContext';
import { getApiErrorMessage } from '../../utils/apiError';

const MAX_PHOTOS = 5;
const ACCEPTED_TYPES = 'image/jpeg,image/png,application/pdf';

export function JustificationCreatePage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [justificationDate, setJustificationDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: employees, run: runEmployees } = useAsync(async () => (await listEmployees()).data);
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    runEmployees();
  }, [runEmployees]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    setPhotos([...photos, ...newFiles]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const isValid = employee && justificationDate && description.length >= 10;

  const handleSubmit = async () => {
    if (!employee) return;
    setSubmitting(true);
    try {
      const result = await createJustification({
        employeeId: employee.id,
        justificationDate,
        description,
        photos,
      });
      showSuccess('Justificación creada');
      navigate(`/justifications/${result.data.id}`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        Nueva Justificación
      </Typography>

      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <EmployeeAutocomplete employees={employees ?? []} value={employee} onChange={setEmployee} />

        <TextField
          label="Fecha"
          type="date"
          value={justificationDate}
          onChange={(e) => setJustificationDate(e.target.value)}
          required
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="Descripción"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          helperText={`Mínimo 10 caracteres (${description.length}/10)`}
          error={description.length > 0 && description.length < 10}
        />

        <Box>
          <Button component="label" variant="outlined" startIcon={<AttachFileIcon />} disabled={photos.length >= MAX_PHOTOS}>
            Adjuntar fotos ({photos.length}/{MAX_PHOTOS})
            <input type="file" hidden multiple accept={ACCEPTED_TYPES} onChange={(e) => handleFiles(e.target.files)} />
          </Button>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
            {photos.map((file, idx) => (
              <Chip key={idx} label={file.name} onDelete={() => removePhoto(idx)} />
            ))}
          </Stack>
        </Box>

        <Button variant="contained" size="large" onClick={handleSubmit} disabled={!isValid || submitting}>
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Crear Justificación'}
        </Button>
      </Paper>
    </Box>
  );
}
