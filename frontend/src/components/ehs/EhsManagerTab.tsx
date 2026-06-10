import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { isEhsManager } from '../../utils/auth'
import { useButtonRules } from '../../hooks/useButtonRules'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { useAlert } from '../../contexts/AlertContext'
import {
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import axiosInstance from '../../api/axiosInstance'
import { EhsManager, EhsManagerRequest } from '../../types/ehsManager.types'
import { ApiResponse } from '../../types/common.types'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'


const categories = ['EHS', '근로자위원', 'CA']

const fetchManagers = async (): Promise<EhsManager[]> => {
  const response = await axiosInstance.get<ApiResponse<EhsManager[]>>('/ehs-managers/list')
  return response.data.data
}

const createManager = async (data: EhsManagerRequest): Promise<EhsManager> => {
  const response = await axiosInstance.post<ApiResponse<EhsManager>>('/ehs-managers', data)
  return response.data.data
}

const updateManager = async ({ id, data }: { id: number; data: EhsManagerRequest }): Promise<EhsManager> => {
  const response = await axiosInstance.put<ApiResponse<EhsManager>>(`/ehs-managers/${id}`, data)
  return response.data.data
}

const deleteManager = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/ehs-managers/${id}`)
}

const EhsManagerTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { showConfirm } = useAlert()
  const [expanded, setExpanded] = useState<string | false>('EHS')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('view')
  const [selectedManager, setSelectedManager] = useState<EhsManager | null>(null)
  const [userPickerOpen, setUserPickerOpen] = useState(false)
  const { user } = useAuth()
  const isAdmin = isEhsManager(user)
  const { canSee } = useButtonRules()
  const MENU = 'EHS 경영 › 커뮤니케이션 › EHS 직책자 명단'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : [user?.role ?? ''].filter(Boolean))]
  const canNew  = canSee(MENU, 'LIST',   'New',  myRoles)
  const canEdit = canSee(MENU, 'DETAIL', '수정', myRoles)
  const canDel  = canSee(MENU, 'DETAIL', '삭제', myRoles)

  const { control, handleSubmit, reset, setValue } = useForm<EhsManagerRequest>({
    defaultValues: {
      roleCategory: '',
      roleDetail: '',
      rolePlace: '',
      userName: '',
      userMail: '',
      userDept: '',
      userCompany: '',
      roleCaHd: '',
      roleCaField: '',
      roleCaTeam: '',
    },
  })

  const { data: managers = [], isLoading, error } = useQuery({
    queryKey: ['ehsManagers'],
    queryFn: fetchManagers,
  })

  const createMutation = useMutation({
    mutationFn: createManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ehsManagers'] })
      setDialogOpen(false)
      reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ehsManagers'] })
      setDialogOpen(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ehsManagers'] })
      setSelectedManager(null)
    },
  })

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const handleAddClick = () => {
    setSelectedManager(null)
    reset({
      roleCategory: '',
      roleDetail: '',
      rolePlace: '',
      userName: '',
      userMail: '',
      userDept: '',
      userCompany: '',
      roleCaHd: '',
      roleCaField: '',
      roleCaTeam: '',
    })
    setDialogMode('add')
    setDialogOpen(true)
  }

  const handleEditClick = (manager: EhsManager) => {
    setSelectedManager(manager)
    reset({
      roleCategory: manager.roleCategory,
      roleDetail: manager.roleDetail || '',
      rolePlace: manager.rolePlace || '',
      userName: manager.userName,
      userMail: manager.userMail || '',
      userDept: manager.userDept || '',
      userCompany: manager.userCompany || '',
      roleCaHd: manager.roleCaHd || '',
      roleCaField: manager.roleCaField || '',
      roleCaTeam: manager.roleCaTeam || '',
    })
    setDialogMode('edit')
    setDialogOpen(true)
  }

  const handleViewClick = (manager: EhsManager) => {
    setSelectedManager(manager)
    setDialogMode('view')
    setDialogOpen(true)
  }

  const handleDeleteClick = async (manager: EhsManager) => {
    const confirmed = await showConfirm(
      '정말로 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.',
      { title: '담당자 삭제' }
    )
    if (confirmed) {
      deleteMutation.mutate(manager.id)
      setDialogOpen(false)
    }
  }

  const handleUserPick = (users: UserInfo[]) => {
    const u = users[0]
    if (u) {
      setValue('userName', u.name || '')
      setValue('userMail', u.email || '')
      setValue('userDept', u.department || '')
      setValue('userCompany', u.company || '')
    }
    setUserPickerOpen(false)
  }

  const onSubmit = (data: EhsManagerRequest) => {
    if (dialogMode === 'add') {
      createMutation.mutate(data)
    } else if (dialogMode === 'edit' && selectedManager) {
      updateMutation.mutate({ id: selectedManager.id, data })
    }
  }

  const getManagersByCategory = (category: string) => {
    return managers
      .filter((m) => m.roleCategory === category)
      .sort((a, b) => (a.roleIdx || '0').localeCompare(b.roleIdx || '0'))
  }

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'EHS':
        return 'EHS 담당자'
      case '근로자위원':
        return '근로자 위원'
      case 'CA':
        return 'Compliance Advisor'
      default:
        return category
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">데이터를 불러오는 중 오류가 발생했습니다.</Alert>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header with New button */}
      {canNew && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={handleAddClick} sx={{ width: { xs: '100%', md: 'auto' } }}>
            New
          </Button>
        </Box>
      )}

      {/* Accordion List */}
      {categories.map((category) => {
        const categoryManagers = getManagersByCategory(category)
        return (
          <Accordion
            key={category}
            expanded={expanded === category}
            onChange={handleAccordionChange(category)}
            disableGutters
            elevation={0}
            sx={{
              mb: 1, border: 1, borderColor: 'divider', borderRadius: 0, overflow: 'hidden',
              '&:before': { display: 'none' },
              '&:first-of-type': { borderRadius: 0 },
              '&:last-of-type': { borderRadius: 0 },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.50', fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>
              <Typography fontWeight="bold">{getCategoryTitle(category)}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {/* PC용 테이블 */}
              <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 600, '& .MuiTableCell-root': { borderColor: 'divider' } }}>
                  <TableBody>
                    {categoryManagers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                          <Typography color="text.secondary">등록된 담당자가 없습니다.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      categoryManagers.map((manager) => (
                        <TableRow
                          key={manager.id}
                          hover
                          onClick={() => handleViewClick(manager)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ width: 130, borderRight: 1, borderColor: 'divider' }}>
                            <Typography variant="body2" color="text.secondary">
                              {manager.roleDetail}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>
                            <Typography variant="body2" color="primary">
                              {manager.userName} ({manager.userMail})
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ width: 200, borderRight: 1, borderColor: 'divider' }}>
                            <Typography variant="body2" color="text.secondary">
                              {manager.rolePlace}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>

              {/* 모바일용 카드 리스트 */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, p: 1.5 }}>
                {categoryManagers.length === 0 ? (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">등록된 담당자가 없습니다.</Typography>
                  </Box>
                ) : (
                  categoryManagers.map((manager) => (
                    <Box
                      key={manager.id}
                      sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, cursor: 'pointer', bgcolor: 'background.paper' }}
                      onClick={() => handleViewClick(manager)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography fontWeight="bold" color="primary">{manager.userName}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>직책</Typography>
                          <Typography variant="body2">{manager.roleDetail || ''}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>이메일</Typography>
                          <Typography variant="body2">{manager.userMail || ''}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Typography variant="body2" sx={{ bgcolor: 'grey.200', px: 1, py: 0.25, borderRadius: 0.5, minWidth: 50 }}>지역</Typography>
                          <Typography variant="body2">{manager.rolePlace || ''}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )
      })}

      {/* Add/Edit/View Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: { xs: 1.5, sm: 2 }, pt: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {dialogMode === 'add' ? '담당자 추가' : dialogMode === 'edit' ? '담당자 수정' : '담당자 정보'}
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            {/* View Mode */}
            {dialogMode === 'view' && (
              <>
                {/* PC용 테이블 레이아웃 */}
                <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mt: 1 }}>
                  {/* Row 1: 카테고리 | 담당자 */}
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      카테고리
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                      <Typography variant="body2">{getCategoryTitle(selectedManager?.roleCategory || '')}</Typography>
                    </Box>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      담당자
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }}>
                      <Typography variant="body2">{selectedManager?.userName || ''}</Typography>
                    </Box>
                  </Box>

                  {/* Row 2: 직책 | Email */}
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      직책
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                      <Typography variant="body2">{selectedManager?.roleDetail || ''}</Typography>
                    </Box>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      Email
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }}>
                      <Typography variant="body2">{selectedManager?.userMail || ''}</Typography>
                    </Box>
                  </Box>

                  {/* Row 3: 근무지 | 지역 */}
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      근무지
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                      <Typography variant="body2">{selectedManager?.userCompany || ''}</Typography>
                    </Box>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      지역
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }}>
                      <Typography variant="body2">{selectedManager?.rolePlace || ''}</Typography>
                    </Box>
                  </Box>

                  {/* Row 4: 소속팀 | 본부 */}
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      소속팀
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                      <Typography variant="body2">{selectedManager?.userDept || ''}</Typography>
                    </Box>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      본부
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }}>
                      <Typography variant="body2">{selectedManager?.roleCaHd || ''}</Typography>
                    </Box>
                  </Box>

                  {/* Row 5: 부문 | 팀 */}
                  <Box sx={{ display: 'flex' }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      부문
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                      <Typography variant="body2">{selectedManager?.roleCaField || ''}</Typography>
                    </Box>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      팀
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }}>
                      <Typography variant="body2">{selectedManager?.roleCaTeam || ''}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 모바일용 레이아웃 */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, pt: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>카테고리</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{getCategoryTitle(selectedManager?.roleCategory || '')}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>담당자</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{selectedManager?.userName || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>직책</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{selectedManager?.roleDetail || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>Email</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{selectedManager?.userMail || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>근무지</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{selectedManager?.userCompany || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>지역</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{selectedManager?.rolePlace || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>소속팀</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{selectedManager?.userDept || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>본부</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{selectedManager?.roleCaHd || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>부문</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{selectedManager?.roleCaField || ''}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>팀</Typography>
                    <Typography variant="body2" sx={{ px: 1.5, py: 0.5 }}>{selectedManager?.roleCaTeam || ''}</Typography>
                  </Box>
                </Box>
              </>
            )}

            {/* Add/Edit Mode - 폼 레이아웃 */}
            {dialogMode !== 'view' && (
              <>
                {/* PC용 테이블 레이아웃 */}
                <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mt: 1 }}>
                  {/* Row 1: 카테고리 | 담당자 */}
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      카테고리 <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                      <Controller
                        name="roleCategory"
                        control={control}
                        rules={{ required: '카테고리를 선택하세요' }}
                        render={({ field, fieldState }) => (
                          <FormControl fullWidth size="small" error={!!fieldState.error}>
                            <Select {...field} displayEmpty>
                              <MenuItem value="" disabled>선택하세요</MenuItem>
                              {categories.map((cat) => (
                                <MenuItem key={cat} value={cat}>{getCategoryTitle(cat)}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Box>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      담당자 <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Controller
                          name="userName"
                          control={control}
                          rules={{ required: '담당자를 선택하세요' }}
                          render={({ field, fieldState }) => (
                            <TextField {...field} placeholder="담당자명" size="small" fullWidth disabled error={!!fieldState.error} helperText={fieldState.error?.message} sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: (theme) => theme.palette.text.primary, '&::placeholder': { WebkitTextFillColor: (theme) => theme.palette.text.disabled, opacity: 1 } } }} />
                          )}
                        />
                        <Button variant="outlined" size="small" startIcon={<PersonSearchIcon />} onClick={() => setUserPickerOpen(true)} sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}>
                          선택
                        </Button>
                      </Box>
                    </Box>
                  </Box>

                  {/* Row 2: 직책 | Email */}
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      직책
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                      <Controller
                        name="roleDetail"
                        control={control}
                        render={({ field }) => <TextField {...field} placeholder="직책" size="small" fullWidth />}
                      />
                    </Box>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      Email
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                      <Controller
                        name="userMail"
                        control={control}
                        render={({ field }) => <TextField {...field} placeholder="email@example.com" size="small" fullWidth />}
                      />
                    </Box>
                  </Box>

                  {/* Row 3: 근무지 | 지역 */}
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      근무지
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                      <Controller
                        name="userCompany"
                        control={control}
                        render={({ field }) => <TextField {...field} placeholder="근무지" size="small" fullWidth />}
                      />
                    </Box>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      지역
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                      <Controller
                        name="rolePlace"
                        control={control}
                        render={({ field }) => <TextField {...field} placeholder="지역" size="small" fullWidth />}
                      />
                    </Box>
                  </Box>

                  {/* Row 4: 소속팀 | 본부 */}
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      소속팀
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                      <Controller
                        name="userDept"
                        control={control}
                        render={({ field }) => <TextField {...field} placeholder="소속팀" size="small" fullWidth />}
                      />
                    </Box>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      본부
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                      <Controller
                        name="roleCaHd"
                        control={control}
                        render={({ field }) => <TextField {...field} placeholder="본부" size="small" fullWidth />}
                      />
                    </Box>
                  </Box>

                  {/* Row 5: 부문 | 팀 */}
                  <Box sx={{ display: 'flex' }}>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      부문
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                      <Controller
                        name="roleCaField"
                        control={control}
                        render={({ field }) => <TextField {...field} placeholder="부문" size="small" fullWidth />}
                      />
                    </Box>
                    <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                      팀
                    </Typography>
                    <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                      <Controller
                        name="roleCaTeam"
                        control={control}
                        render={({ field }) => <TextField {...field} placeholder="팀" size="small" fullWidth />}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* 모바일용 레이아웃 */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, pt: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                      카테고리 <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
                    </Typography>
                    <Controller
                      name="roleCategory"
                      control={control}
                      rules={{ required: '카테고리를 선택하세요' }}
                      render={({ field, fieldState }) => (
                        <FormControl fullWidth size="small" error={!!fieldState.error}>
                          <Select {...field} displayEmpty>
                            <MenuItem value="" disabled>선택하세요</MenuItem>
                            {categories.map((cat) => (
                              <MenuItem key={cat} value={cat}>{getCategoryTitle(cat)}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>
                      담당자 <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Controller
                        name="userName"
                        control={control}
                        rules={{ required: '담당자를 선택하세요' }}
                        render={({ field, fieldState }) => (
                          <TextField {...field} placeholder="담당자명" size="small" fullWidth disabled error={!!fieldState.error} helperText={fieldState.error?.message} sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: (theme) => theme.palette.text.primary, '&::placeholder': { WebkitTextFillColor: (theme) => theme.palette.text.disabled, opacity: 1 } } }} />
                        )}
                      />
                      <Button variant="outlined" size="small" startIcon={<PersonSearchIcon />} onClick={() => setUserPickerOpen(true)} sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}>
                        선택
                      </Button>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>직책</Typography>
                    <Controller
                      name="roleDetail"
                      control={control}
                      render={({ field }) => <TextField {...field} placeholder="직책" size="small" fullWidth />}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>Email</Typography>
                    <Controller
                      name="userMail"
                      control={control}
                      render={({ field }) => <TextField {...field} placeholder="email@example.com" size="small" fullWidth />}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>근무지</Typography>
                    <Controller
                      name="userCompany"
                      control={control}
                      render={({ field }) => <TextField {...field} placeholder="근무지" size="small" fullWidth />}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>지역</Typography>
                    <Controller
                      name="rolePlace"
                      control={control}
                      render={({ field }) => <TextField {...field} placeholder="지역" size="small" fullWidth />}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>소속팀</Typography>
                    <Controller
                      name="userDept"
                      control={control}
                      render={({ field }) => <TextField {...field} placeholder="소속팀" size="small" fullWidth />}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>본부</Typography>
                    <Controller
                      name="roleCaHd"
                      control={control}
                      render={({ field }) => <TextField {...field} placeholder="본부" size="small" fullWidth />}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>부문</Typography>
                    <Controller
                      name="roleCaField"
                      control={control}
                      render={({ field }) => <TextField {...field} placeholder="부문" size="small" fullWidth />}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>팀</Typography>
                    <Controller
                      name="roleCaTeam"
                      control={control}
                      render={({ field }) => <TextField {...field} placeholder="팀" size="small" fullWidth />}
                    />
                  </Box>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ borderTop: 1, borderColor: 'divider', px: { xs: 2, sm: 3 }, py: 2, flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
            <Button
              onClick={() => setDialogOpen(false)}
              sx={{ flex: { xs: 1, sm: 'none' } }}
            >
              {dialogMode === 'view' ? '닫기' : '취소'}
            </Button>
            {dialogMode === 'view' && selectedManager && (
              <>
                {canDel && <Button variant="contained" color="error" onClick={() => handleDeleteClick(selectedManager)} sx={{ flex: { xs: 1, sm: 'none' } }}>삭제</Button>}
                {canEdit && <Button variant="contained" onClick={() => handleEditClick(selectedManager)} sx={{ flex: { xs: 1, sm: 'none' } }}>수정</Button>}
              </>
            )}
            {dialogMode !== 'view' && (
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending || updateMutation.isPending}
                sx={{ flex: { xs: 1, sm: 'none' } }}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : dialogMode === 'add' ? (
                  '등록'
                ) : (
                  '저장'
                )}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      <UserSelectModal
        open={userPickerOpen}
        onClose={() => setUserPickerOpen(false)}
        selectedUsers={[]}
        onConfirm={handleUserPick}
        singleSelect
        useCompanyTree
        title="담당자 선택 (조직도)"
      />
    </Box>
  )
}

export default EhsManagerTab
