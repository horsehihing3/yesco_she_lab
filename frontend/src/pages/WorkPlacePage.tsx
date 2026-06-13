import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useForm } from 'react-hook-form'
import { useAlert } from '../contexts/AlertContext'
import { workplaceApi } from '../api/workplaceApi'
import { WorkPlace, WorkPlaceRequest } from '../types/workPlace.types'

const WorkPlacePage: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const theme = useTheme()
  const { showConfirm, showSuccess } = useAlert()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWorkPlace, setEditingWorkPlace] = useState<WorkPlace | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['workplaces', page, rowsPerPage],
    queryFn: () => workplaceApi.listPaged(page, rowsPerPage),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WorkPlaceRequest>()

  const createMutation = useMutation({
    mutationFn: (data: WorkPlaceRequest) => workplaceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workplaces'] })
      handleCloseDialog()
      showSuccess(t('workPlacePage.msg1', '사업장이 등록되었습니다.'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WorkPlaceRequest }) => workplaceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workplaces'] })
      handleCloseDialog()
      showSuccess(t('workPlacePage.msg2', '사업장이 수정되었습니다.'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => workplaceApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workplaces'] })
    },
  })

  const handleOpenDialog = (workPlace?: WorkPlace) => {
    if (workPlace) {
      setEditingWorkPlace(workPlace)
      reset({
        place: workPlace.place,
        floor: workPlace.floor,
        imagePath: workPlace.imagePath,
      })
    } else {
      setEditingWorkPlace(null)
      reset({})
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingWorkPlace(null)
    reset({})
  }

  const onSubmit = (formData: WorkPlaceRequest) => {
    if (editingWorkPlace) {
      updateMutation.mutate({ id: editingWorkPlace.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(t('workPlacePage.msg3', '이 사업장을 삭제하시겠습니까?'))
    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().substring(0, 10)
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">Failed to load work places</Alert>
  }

  return (
    <Box sx={{ overflow: 'hidden' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Work Places
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          New Work Place
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }}>Place</TableCell>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }}>Floor</TableCell>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.content.map((workPlace) => (
              <TableRow key={workPlace.id} hover>
                <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{workPlace.place}</TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{workPlace.floor || ''}</TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>
                  <Chip
                    label={workPlace.used ? 'Active' : 'Inactive'}
                    size="small"
                    color={workPlace.used ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{formatDate(workPlace.createdAt)}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenDialog(workPlace)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(workPlace.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data?.content.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No work places found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.totalElements || 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editingWorkPlace ? 'Edit Work Place' : 'New Work Place'}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Place Name"
              margin="normal"
              {...register('place', { required: 'Place name is required' })}
              error={!!errors.place}
              helperText={errors.place?.message}
            />
            <TextField fullWidth label="Floor" margin="normal" {...register('floor')} />
            <TextField fullWidth label="Image Path" margin="normal" {...register('imagePath')} />
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingWorkPlace ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

export default WorkPlacePage
