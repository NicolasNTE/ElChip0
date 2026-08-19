import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
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
import { getAttendanceByEmployee, getAttendanceByCompany, getAttendanceByDateRange } from '../../api/attendance.api';
import { listCompanies } from '../../api/companies.api';
import { listEmployees } from '../../api/employees.api';
import type { AttendanceRecord, Company, Employee } from '../../types';
import { useAsync } from '../../hooks/useAsync';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function firstOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

export function AttendanceListPage() {
  const [companyId, setCompanyId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState(firstOfMonthISO());
  const [endDate, setEndDate] = useState(todayISO());

  const { data: companies, run: runCompanies } = useAsync(async () => (await listCompanies()).data);
  const { data: employees, run: runEmployees } = useAsync(async (cId?: string) => (await listEmployees(cId)).data);
  const {
    data: records,
    loading,
    error,
    run: runRecords,
  } = useAsync(async (): Promise<AttendanceRecord[]> => {
    if (employeeId) {
      return (await getAttendanceByEmployee(employeeId, startDate, endDate)).data;
    }
    if (companyId) {
      return (await getAttendanceByCompany(companyId, startDate, endDate)).data;
    }
    return (await getAttendanceByDateRange(startDate, endDate)).data;
  });

  useEffect(() => {
    runCompanies();
  }, [runCompanies]);

  useEffect(() => {
    runEmployees(companyId || undefined);
    setEmployeeId('');
  }, [runEmployees, companyId]);

  const handleSearch = () => {
    runRecords();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Asistencias
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          select
          label="Empresa"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {companies?.map((c: Company) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Empleado"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {employees?.map((emp: Employee) => (
            <MenuItem key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Desde"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Hasta"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button variant="contained" onClick={handleSearch}>
          Buscar
        </Button>
      </Box>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={handleSearch} />}

      {records && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Empleado</TableCell>
                <TableCell>Origen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.recordDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={record.type}
                      color={record.type === 'entrada' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : '-'}
                  </TableCell>
                  <TableCell>{record.source || '-'}</TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay registros para el filtro seleccionado
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
