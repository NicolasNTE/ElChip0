import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  ImageListItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import {
  getJustification,
  approveJustification,
  rejectJustification,
  removeJustification,
  addJustificationPhotos,
  removeJustificationPhoto,
} from '../../api/justifications.api';
import type { JustificationPhoto } from '../../types';
import { useAsync } from '../../hooks/useAsync';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { StatusChip } from '../../components/StatusChip';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { photoUrl } from '../../utils/photoUrl';

export function JustificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const { data: justification, loading, error, run } = useAsync(async () => (await getJustification(id!)).data);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reviewedBy, setReviewedBy] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState<JustificationPhoto | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) run();
  }, [run, id]);

  const handleApprove = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await approveJustification(id, reviewedBy);
      showSuccess('Justificación aprobada');
      setApproveOpen(false);
      setReviewedBy('');
      run();
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await rejectJustification(id, rejectionReason, reviewedBy);
      showSuccess('Justificación rechazada');
      setRejectOpen(false);
      setReviewedBy('');
      setRejectionReason('');
      run();
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files || !id) return;
    try {
      await addJustificationPhotos(id, Array.from(files));
      showSuccess('Fotos agregadas');
      run();
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    if (!id) return;
    try {
      await removeJustificationPhoto(id, photoId);
      showSuccess('Foto eliminada');
      run();
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await removeJustification(id);
      showSuccess('Justificación eliminada');
      navigate('/justifications');
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => run()} />;
  if (!justification) return null;

  const isPending = justification.status === 'pendiente';

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/justifications')} sx={{ mb: 2 }}>
        Volver
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5">
              {justification.employee ? `${justification.employee.firstName} ${justification.employee.lastName}` : 'Empleado'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(justification.justificationDate).toLocaleDateString()}
            </Typography>
          </Box>
          <StatusChip status={justification.status} />
        </Box>

        <Typography variant="body1" sx={{ mb: 2 }}>
          {justification.description}
        </Typography>

        {justification.status === 'rechazada' && justification.rejectionReason && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="error">
              Motivo de rechazo:
            </Typography>
            <Typography variant="body2">{justification.rejectionReason}</Typography>
          </Box>
        )}

        {justification.reviewedBy && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Revisado por {justification.reviewedBy}
            {justification.reviewedAt && ` el ${new Date(justification.reviewedAt).toLocaleString()}`}
          </Typography>
        )}

        <Typography variant="subtitle1" gutterBottom>
          Fotos y documentos
        </Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {justification.photos.map((photo) => (
            <Grid key={photo.id} size={{ xs: 6, sm: 4, md: 3 }}>
              <Box sx={{ position: 'relative' }}>
                {photo.mimeType === 'application/pdf' ? (
                  <Box
                    component="a"
                    href={photoUrl(photo)}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 120,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      textDecoration: 'none',
                    }}
                  >
                    <PictureAsPdfIcon fontSize="large" color="error" />
                    <Typography variant="caption" noWrap sx={{ width: '90%', textAlign: 'center' }}>
                      {photo.fileName}
                    </Typography>
                  </Box>
                ) : (
                  <ImageListItem sx={{ cursor: 'pointer' }} onClick={() => setLightboxPhoto(photo)}>
                    <img src={photoUrl(photo)} alt={photo.fileName} style={{ height: 120, objectFit: 'cover', borderRadius: 4 }} />
                  </ImageListItem>
                )}
                {isPending && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemovePhoto(photo.id)}
                    sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'background.paper' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Grid>
          ))}
          {justification.photos.length === 0 && (
            <Grid size={12}>
              <Typography variant="body2" color="text.secondary">
                Sin fotos adjuntas
              </Typography>
            </Grid>
          )}
        </Grid>

        {isPending && (
          <Button component="label" size="small" startIcon={<AttachFileIcon />} sx={{ mb: 2 }}>
            Agregar más fotos
            <input type="file" hidden multiple accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleAddPhotos(e.target.files)} />
          </Button>
        )}

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          {isPending && (
            <>
              <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => setApproveOpen(true)}>
                Aprobar
              </Button>
              <Button variant="contained" color="error" startIcon={<CancelIcon />} onClick={() => setRejectOpen(true)}>
                Rechazar
              </Button>
            </>
          )}
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)} sx={{ ml: 'auto' }}>
            Eliminar
          </Button>
        </Stack>
      </Paper>

      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Aprobar Justificación</DialogTitle>
        <DialogContent>
          <TextField
            label="Revisado por"
            value={reviewedBy}
            onChange={(e) => setReviewedBy(e.target.value)}
            fullWidth
            required
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={handleApprove} disabled={!reviewedBy || actionLoading}>
            Aprobar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Rechazar Justificación</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Revisado por" value={reviewedBy} onChange={(e) => setReviewedBy(e.target.value)} fullWidth required />
          <TextField
            label="Motivo del rechazo"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            helperText="Mínimo 10 caracteres"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!reviewedBy || rejectionReason.length < 10 || actionLoading}
          >
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!lightboxPhoto} onClose={() => setLightboxPhoto(null)} maxWidth="md">
        {lightboxPhoto && <img src={photoUrl(lightboxPhoto)} alt={lightboxPhoto.fileName} style={{ maxWidth: '100%', display: 'block' }} />}
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar justificación"
        description="¿Seguro que deseas eliminar esta justificación? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        confirmLabel="Eliminar"
      />
    </Box>
  );
}
