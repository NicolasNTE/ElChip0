import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { getPayrollReport, downloadPayrollCsv } from '../../api/reports.api';
import { listCompanies } from '../../api/companies.api';
import type { Company } from '../../types';
import { useAsync } from '../../hooks/useAsync';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { downloadBlob } from '../../utils/download';
import { useNotification } from '../../context/NotificationContext';
import { getApiErrorMessage } from '../../utils/apiError';

function firstOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function PayrollReportPage() {
  const [startDate, setStartDate] = useState(firstOfMonthISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [companyId, setCompanyId] = useState('');
  const [downloading, setDownloading] = useState(false);

  const { data: companies, run: runCompanies } = useAsync(async () => (await listCompanies()).data);
  const { data: report, loading, error, run } = useAsync(async () => (await getPayrollReport(startDate, endDate, companyId || undefined)).data);
  const { showError } = useNotification();

  useEffect(() => {
    runCompanies();
  }, [runCompanies]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = () => run();

  const handleDownloadCsv = async () => {
    setDownloading(true);
    try {
      const response = await downloadPayrollCsv(startDate, endDate, companyId || undefined);
      downloadBlob(response.data, `payroll_${startDate}_${endDate}.csv`);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reporte de Nómina
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Desde"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Hasta"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField select label="Empresa" value={companyId} onChange={(e) => setCompanyId(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="">Todas</MenuItem>
          {companies?.map((c: Company) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={handleGenerate}>
          Generar
        </Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadCsv} disabled={downloading}>
          Descargar CSV
        </Button>
      </Box>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={handleGenerate} />}

      {report && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell>ID</TableCell>
                <TableCell align="right">Días Laborales</TableCell>
                <TableCell align="right">Días Asistidos</TableCell>
                <TableCell align="right">Faltas Justificadas</TableCell>
                <TableCell align="right">Faltas Sin Justificar</TableCell>
                <TableCell align="right">% Asistencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.payrollData.map((row) => (
                <TableRow key={row.employee.id}>
                  <TableCell>
                    {row.employee.firstName} {row.employee.lastName}
                  </TableCell>
                  <TableCell>{row.employee.employeeId}</TableCell>
                  <TableCell align="right">{row.workDays}</TableCell>
                  <TableCell align="right">{row.attendedDays}</TableCell>
                  <TableCell align="right">{row.justifiedAbsenceDays}</TableCell>
                  <TableCell align="right">{row.unjustifiedAbsenceDays}</TableCell>
                  <TableCell align="right">{row.attendancePercentage}%</TableCell>
                </TableRow>
              ))}
              {report.payrollData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay datos para el período seleccionado
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
