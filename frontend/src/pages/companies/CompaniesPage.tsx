import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { listCompanies, createCompany, updateCompany, removeCompany, type CompanyInput } from '../../api/companies.api';
import type { Company } from '../../types';
import { useAsync } from '../../hooks/useAsync';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CompanyFormDialog } from './CompanyFormDialog';
import { useNotification } from '../../context/NotificationContext';
import { getApiErrorMessage } from '../../utils/apiError';

export function CompaniesPage() {
  const { data: companies, loading, error, run } = useAsync(async () => (await listCompanies()).data);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    run();
  }, [run]);

  const openCreate = () => {
    setEditingCompany(null);
    setDialogOpen(true);
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: CompanyInput) => {
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, input);
        showSuccess('Empresa actualizada');
      } else {
        await createCompany(input);
        showSuccess('Empresa creada');
      }
      setDialogOpen(false);
      run();
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deletingCompany) return;
    try {
      await removeCompany(deletingCompany.id);
      showSuccess('Empresa eliminada');
      setDeletingCompany(null);
      run();
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Empresas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nueva Empresa
        </Button>
      </Box>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={() => run()} />}

      {companies && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>RUC</TableCell>
                <TableCell>Dirección</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>{company.name}</TableCell>
                  <TableCell>{company.ruc || '-'}</TableCell>
                  <TableCell>{company.address || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openEdit(company)} size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => setDeletingCompany(company)} size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No hay empresas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CompanyFormDialog
        open={dialogOpen}
        company={editingCompany}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingCompany}
        title="Eliminar empresa"
        description={`¿Seguro que deseas eliminar "${deletingCompany?.name}"? Esta acción eliminará también sus empleados asociados.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCompany(null)}
        confirmLabel="Eliminar"
      />
    </Box>
  );
}
