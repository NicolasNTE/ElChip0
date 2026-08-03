import { useRef, useState, type DragEvent } from 'react';
import { Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { importExcel } from '../../api/attendance.api';
import { useAsync } from '../../hooks/useAsync';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error'> = {
  success: 'success',
  skipped: 'warning',
  error: 'error',
};

export function AttendanceImportPage() {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: result, loading, error, run } = useAsync(async (file: File) => (await importExcel(file)).data);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    run(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    handleFile(event.dataTransfer.files[0]);
  };

  const skippedCount = result ? result.results.filter((r) => r.status === 'skipped').length : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Importar Asistencia
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Sube el archivo Excel (.xlsx/.xls) exportado del sistema biométrico. Columnas esperadas: employeeId, timestamp, type
        (entrada/salida).
      </Typography>

      <Paper
        variant="outlined"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          mt: 2,
          p: 6,
          textAlign: 'center',
          cursor: 'pointer',
          borderStyle: 'dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          bgcolor: dragOver ? 'action.hover' : 'transparent',
        }}
      >
        <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
        <Typography variant="body1" sx={{ mt: 1 }}>
          Arrastra el archivo aquí o haz clic para seleccionar
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </Paper>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {result && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip label={`Total: ${result.totalRecords}`} />
            <Chip label={`Éxitos: ${result.successCount}`} color="success" />
            <Chip label={`Duplicados: ${skippedCount}`} color="warning" />
            <Chip label={`Errores: ${result.errorCount}`} color="error" />
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID Empleado</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Mensaje</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.results.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.employeeId}</TableCell>
                    <TableCell>{row.timestamp ?? '-'}</TableCell>
                    <TableCell>
                      <Chip label={row.status} color={STATUS_COLOR[row.status]} size="small" />
                    </TableCell>
                    <TableCell>{row.message ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
