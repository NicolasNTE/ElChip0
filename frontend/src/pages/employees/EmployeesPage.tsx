import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { listEmployees, createEmployee, updateEmployee, removeEmployee, type EmployeeInput } from '../../api/employees.api';
import { listCompanies } from '../../api/companies.api';
import type { Employee } from '../../types';
import { useAsync } from '../../hooks/useAsync';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import { useNotification } from '../../context/NotificationContext';
import { getApiErrorMessage } from '../../utils/apiError';

export function EmployeesPage() {
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const { data: employees, loading, error, run } = useAsync(async (companyId?: string) => (await listEmployees(companyId)).data);
  const { data: companies, run: runCompanies } = useAsync(async () => (await listCompanies()).data);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    runCompanies();
  }, [runCompanies]);

  useEffect(() => {
    run(companyFilter || undefined);
  }, [run, companyFilter]);

  const openCreate = () => {
    setEditingEmployee(null);
    setDialogOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: EmployeeInput) => {
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, input);
        showSuccess('Empleado actualizado');
      } else {
        await createEmployee(input);
        showSuccess('Empleado creado');
      }
      setDialogOpen(false);
      run(companyFilter || undefined);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    try {
      await removeEmployee(deletingEmployee.id);
      showSuccess('Empleado eliminado');
      setDeletingEmployee(null);
      run(companyFilter || undefined);
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Empleados</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={!companies?.length}>
          Nuevo Empleado
        </Button>
      </Box>

      <TextField
        select
        label="Filtrar por empresa"
        value={companyFilter}
        onChange={(e) => setCompanyFilter(e.target.value)}
        sx={{ mb: 2, minWidth: 240 }}
      >
        <MenuItem value="">Todas las empresas</MenuItem>
        {companies?.map((company) => (
          <MenuItem key={company.id} value={company.id}>
            {company.name}
          </MenuItem>
        ))}
      </TextField>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={() => run(companyFilter || undefined)} />}

      {employees && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>ID Empleado</TableCell>
                <TableCell>Empresa</TableCell>
                <TableCell>Horario</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    {employee.firstName} {employee.lastName}
                  </TableCell>
                  <TableCell>{employee.employeeId}</TableCell>
                  <TableCell>{employee.company?.name ?? '-'}</TableCell>
                  <TableCell>
                    {employee.scheduledStartTime} - {employee.scheduledEndTime}
                  </TableCell>
                  <TableCell>{employee.email || employee.phone || '-'}</TableCell>
                  <TableCell>
                    <Chip label={employee.isActive ? 'Activo' : 'Inactivo'} color={employee.isActive ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openEdit(employee)} size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => setDeletingEmployee(employee)} size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay empleados registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <EmployeeFormDialog
        open={dialogOpen}
        employee={editingEmployee}
        companies={companies ?? []}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingEmployee}
        title="Eliminar empleado"
        description={`¿Seguro que deseas eliminar a "${deletingEmployee?.firstName} ${deletingEmployee?.lastName}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingEmployee(null)}
        confirmLabel="Eliminar"
      />
    </Box>
  );
}
