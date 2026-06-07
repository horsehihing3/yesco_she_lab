import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, Pagination,
  IconButton, CircularProgress, Alert, Chip, Select, MenuItem,
  FormControl, Grid, Switch, FormControlLabel,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import ListSearchBar from '../common/ListSearchBar'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import axiosInstance from '../../api/axiosInstance'
import { WemFactor, WemFactorRequest } from '../../types/workEnvMeasurement.types'
import { ApiResponse, PageResponse } from '../../types/common.types'
import LoadingOverlay from '../common/LoadingOverlay'
import useCodeMap from '../../hooks/useCodeMap'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

// ===== API functions =====
const fetchFactors = async (page: number, size: number): Promise<PageResponse<WemFactor>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<WemFactor>>>(`/wem-factors?page=${page}&size=${size}`)
  return res.data.data
}

const searchFactors = async (keyword: string, page: number, size: number): Promise<PageResponse<WemFactor>> => {
  const res = await axiosInstance.get<ApiResponse<PageResponse<WemFactor>>>(`/wem-factors/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
  return res.data.data
}

const fetchFactorDetail = async (id: number): Promise<WemFactor> => {
  const res = await axiosInstance.get<ApiResponse<WemFactor>>(`/wem-factors/${id}`)
  return res.data.data
}

const createFactor = async (data: WemFactorRequest): Promise<WemFactor> => {
  const res = await axiosInstance.post<ApiResponse<WemFactor>>('/wem-factors', data)
  return res.data.data
}

const updateFactor = async ({ id, data }: { id: number; data: WemFactorRequest }): Promise<WemFactor> => {
  const res = await axiosInstance.put<ApiResponse<WemFactor>>(`/wem-factors/${id}`, data)
  return res.data.data
}

const deleteFactor = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/wem-factors/${id}`)
}

// ===== Constants =====
const labelSx = {
  width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }
const lastRowSx = { display: 'flex', borderColor: 'grey.300' }

const MENU = '보건 관리 › 작업환경 측정 › 유해인자'

const WemFactorTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
  }
  const { showWarning, showSuccess, showConfirm } = useAlert()
  const { user } = useAuth()
  const { canSee } = useButtonRules()
  const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.role === 'EHS_ADMIN'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : []), ...(user?.role ? [user.role] : [])]
  const { codeList: hazardTypeCodes, getLabel: getHazardTypeLabel } = useCodeMap('WEM_HAZARD_TYPE')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<WemFactor | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const emptyForm: WemFactorRequest = {
    factorName: '',
  }
  const [formData, setFormData] = useState<WemFactorRequest>(emptyForm)

  // ===== Queries =====
  const { data, isLoading } = useQuery({
    queryKey: ['wemFactors', page, searchQuery],
    queryFn: () =>
      searchQuery
        ? searchFactors(searchQuery, page, rowsPerPage)
        : fetchFactors(page, rowsPerPage),
    enabled: viewMode === 'list',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['wemFactorDetail', selectedItem?.id],
    queryFn: () => fetchFactorDetail(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: createFactor,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemFactors'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateFactor,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemFactors'] })
      queryClient.invalidateQueries({ queryKey: ['wemFactorDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFactor,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['wemFactors'] })
      await showSuccess(t('common.deleted', '삭제되었습니다'))
      handleBackToList()
    },
  })

  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // ===== Handlers =====
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedItem(null)
    setFormData({ ...emptyForm })
  }

  const handleReset = () => {
    setSearchText('')
    setSearchQuery('')
    setTypeFilter('')
    setPage(0)
  }

  const handleSearch = () => {
    setSearchQuery(searchText)
    setPage(0)
  }

  const handleRowClick = (item: WemFactor) => {
    setSelectedItem(item)
    setViewMode('detail')
  }

  const handleAddClick = () => {
    setSelectedItem(null)
    setFormData({ ...emptyForm })
    setViewMode('create')
  }

  const handleEditClick = () => {
    if (!detail) return
    setFormData({
      factorName: detail.factorName,
      factorNameEn: detail.factorNameEn || '',
      casNumber: detail.casNumber || '',
      factorType: detail.factorType || '',
      twa: detail.twa || '',
      stel: detail.stel || '',
      ceilingValue: detail.ceilingValue || '',
      unit: detail.unit || '',
      msdsLinked: detail.msdsLinked,
      isPermitted: detail.isPermitted,
      usedProcess: detail.usedProcess || '',
      remarks: detail.remarks || '',
    })
    setViewMode('edit')
  }

  const handleDeleteClick = async () => {
    if (!selectedItem) return
    const confirmed = await showConfirm(
      `${t('common.confirmDeleteMessage', '삭제하시겠습니까?')}\n${t('common.deleteWarning', '이 작업은 되돌릴 수 없습니다.')}`,
      { title: t('common.delete', '삭제') }
    )
    if (confirmed) {
      deleteMutation.mutate(selectedItem.id)
    }
  }

  const handleSubmit = async () => {
    if (!formData.factorName) {
      showWarning(t('wem.factorName') + ' ' + t('common.required', '필수입니다'))
      return
    }
    const confirmed = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!confirmed) return

    if (viewMode === 'create') {
      createMutation.mutate(formData)
    } else if (viewMode === 'edit' && selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: formData })
    }
  }

  const items = data?.content || []
  const filteredItems = typeFilter ? items.filter(i => i.factorType === typeFilter) : items
  const totalPages = data?.totalPages || 0

  // KPI cards
  const organicCount = items.filter(i => i.factorType === 'ORGANIC').length
  const metalCount = items.filter(i => i.factorType === 'METAL' || i.factorType === 'ACID').length
  const physicalCount = items.filter(i => i.factorType === 'PHYSICAL').length
  const dustCount = items.filter(i => i.factorType === 'DUST').length

  // ===== RENDER: List =====
  if (viewMode === 'list') {
    return (
      <Box>
        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: t('wem.typeOrganic'), value: organicCount, color: '#3b82f6' },
            { label: t('wem.typeMetal') + '/' + t('wem.typeAcid'), value: metalCount, color: '#f59e0b' },
            { label: t('wem.typePhysical'), value: physicalCount, color: '#8b5cf6' },
            { label: t('wem.typeDust'), value: dustCount, color: '#6b7280' },
          ].map((card, idx) => (
            <Grid item xs={6} md={3} key={idx}>
              <Paper sx={{ p: 2, borderLeft: 4, borderColor: card.color }}>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Toolbar - PC */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mb: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              {hazardTypeCodes.map(c => (
                <MenuItem key={c.code} value={c.code}>{getHazardTypeLabel(c.code)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <ListSearchBar placeholder={t('common.search')} value={searchText} onChange={setSearchText} onSearch={handleSearch} sx={{ minWidth: 200 }} />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          <Box sx={{ flex: 1 }} />
          {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="small">
            {t('common.new')}
          </Button>
          )}
        </Box>
        {/* Toolbar - Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {hazardTypeCodes.map(c => (
                  <MenuItem key={c.code} value={c.code}>{getHazardTypeLabel(c.code)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <ListSearchBar placeholder={t('common.search')} value={searchText} onChange={setSearchText} onSearch={handleSearch} sx={{ flex: 1 }} />
            <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          </Box>
          {canSee(MENU, 'LIST', '신규 등록', myRoles) && (
          <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={handleAddClick} size="small">
            {t('common.new')}
          </Button>
          )}
        </Box>

        {/* Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filteredItems.length === 0 ? (
          <Alert severity="info">{t('common.noData')}</Alert>
        ) : (
          <>
            <TableContainer sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={hSx} align="center">{t('common.no')}</TableCell>
                    <TableCell sx={hSx}>{t('wem.factorName')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.category', '구분')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.casNumber')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.twa')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.stel')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.unit')}</TableCell>
                    <TableCell sx={hSx}>{t('wem.usedProcess')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('wem.msdsLinked')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item, idx) => {
                    // 발암성/물리적/분진/생물학적/화학적 분류 추정
                    const isCarcinogen = item.isPermitted
                      || /벤젠|benzene|silica|실리카|규산|포름알|formaldehyde|크롬|chromium|니켈|nickel|카드뮴|cadmium|벤지딘|asbestos|석면/i.test(item.factorName + ' ' + (item.factorNameEn || ''))
                    const isPhysical = item.factorType === 'PHYSICAL'
                      || /소음|noise|진동|vibration|방사선|radiation|온도|열|cold heat/i.test(item.factorName + ' ' + (item.factorNameEn || ''))
                    const isDust = item.factorType === 'DUST'
                      || /분진|dust|흄|fume/i.test(item.factorName + ' ' + (item.factorNameEn || ''))
                    let chipLabel: string, chipColor: 'error' | 'warning' | 'default' | 'info' | 'success' = 'default', chipVariant: 'filled' | 'outlined' = 'outlined'
                    if (isCarcinogen) { chipLabel = '발암성'; chipColor = 'error'; chipVariant = 'filled' }
                    else if (isPhysical) { chipLabel = '물리적'; chipColor = 'warning' }
                    else if (isDust) { chipLabel = '분진'; chipColor = 'default' }
                    else { chipLabel = '화학'; chipColor = 'info' }
                    return (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(item)}
                    >
                      <TableCell align="center">{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{item.factorName}</Typography>
                          {item.factorNameEn && (
                            <Typography variant="caption" color="text.secondary">
                              ({item.factorNameEn})
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={chipLabel} color={chipColor} variant={chipVariant} size="small" />
                      </TableCell>
                      <TableCell align="center">{item.casNumber || ''}</TableCell>
                      <TableCell align="center">{item.twa || ''}</TableCell>
                      <TableCell align="center">{item.stel || ''}</TableCell>
                      <TableCell align="center">{item.unit || ''}</TableCell>
                      <TableCell>{item.usedProcess || ''}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.msdsLinked ? t('wem.msdsLinkedYes', '연동') : t('wem.msdsLinkedNo', '미등록')}
                          color={item.msdsLinked ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(_, p) => setPage(p - 1)}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    )
  }

  // ===== RENDER: Detail =====
  if (viewMode === 'detail') {
    if (detailLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
    const d = detail
    if (!d) return <Alert severity="error">{t('common.noData')}</Alert>

    return (
      <Box>
        {/* PC */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.factorName')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.factorName}</Typography></Box>
            <Box sx={labelSx}>{t('wem.factorNameEn')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.factorNameEn || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.casNumber')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.casNumber || ''}</Typography></Box>
            <Box sx={labelSx}>{t('wem.factorType')}</Box>
            <Box sx={valSx}><Typography variant="body2">{getHazardTypeLabel(d.factorType || '') || d.factorType || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.twa')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.twa || ''}</Typography></Box>
            <Box sx={labelSx}>{t('wem.stel')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.stel || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.ceiling')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.ceilingValue || ''}</Typography></Box>
            <Box sx={labelSx}>{t('wem.unit')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.unit || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.msdsLinked')}</Box>
            <Box sx={valBorderSx}>
              <Chip
                label={d.msdsLinked ? t('wem.msdsLinkedYes', '연동') : t('wem.msdsLinkedNo', '미등록')}
                color={d.msdsLinked ? 'success' : 'default'}
                size="small"
              />
            </Box>
            <Box sx={labelSx}>{t('wem.isPermitted')}</Box>
            <Box sx={valSx}>
              <Chip
                label={d.isPermitted ? t('wem.permitted', '허가') : t('wem.notPermitted', '일반')}
                color={d.isPermitted ? 'warning' : 'default'}
                size="small"
              />
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('wem.usedProcess')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.usedProcess || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('common.remarks', '비고')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.remarks || ''}</Typography></Box>
          </Box>
          {/* 작성자 | 작성일자 */}
          <Box sx={d.modifiedAt && d.modifiedAt !== d.createdAt ? rowSx : lastRowSx}>
            <Box sx={labelSx}>{t('common.creator', '작성자')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.createdByName || ''}</Typography></Box>
            <Box sx={labelSx}>{t('audit.createdAt', '작성일자')}</Box>
            <Box sx={valSx}><Typography variant="body2">{formatDate(d.createdAt)}</Typography></Box>
          </Box>
          {/* 수정자 | 수정일자 — 수정 이력 있을 때만 */}
          {d.modifiedAt && d.modifiedAt !== d.createdAt && (
            <Box sx={lastRowSx}>
              <Box sx={labelSx}>{t('common.modifier', '수정자')}</Box>
              <Box sx={valBorderSx}><Typography variant="body2">{d.modifiedByName || ''}</Typography></Box>
              <Box sx={labelSx}>{t('common.modifiedAt', '수정일자')}</Box>
              <Box sx={valSx}><Typography variant="body2">{formatDate(d.modifiedAt)}</Typography></Box>
            </Box>
          )}
        </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          {[
            [t('wem.factorName'), d.factorName],
            [t('wem.factorNameEn'), d.factorNameEn],
            [t('wem.casNumber'), d.casNumber],
            [t('wem.factorType'), getHazardTypeLabel(d.factorType || '') || d.factorType],
            [t('wem.twa'), d.twa],
            [t('wem.stel'), d.stel],
            [t('wem.ceiling'), d.ceilingValue],
            [t('wem.unit'), d.unit],
            [t('wem.msdsLinked'), d.msdsLinked ? t('wem.msdsLinkedYes', '연동') : t('wem.msdsLinkedNo', '미등록')],
            [t('wem.isPermitted'), d.isPermitted ? t('wem.permitted', '허가') : t('wem.notPermitted', '일반')],
            [t('wem.usedProcess'), d.usedProcess],
            [t('common.remarks', '비고'), d.remarks],
            [t('common.creator', '작성자'), d.createdByName || ''],
            [t('audit.createdAt', '작성일자'), formatDate(d.createdAt)],
            ...(d.modifiedAt && d.modifiedAt !== d.createdAt ? [
              [t('common.modifier', '수정자'), d.modifiedByName || ''],
              [t('common.modifiedAt', '수정일자'), formatDate(d.modifiedAt)],
            ] : []),
          ].filter(([, v]) => v).map(([label, value], i) => (
            <Box key={i}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography>
              <Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.backToList')}</Button>
          {canSee(MENU, 'DETAIL', '수정', myRoles) && (
            <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.edit')}</Button>
          )}
          {canSee(MENU, 'DETAIL', '삭제', myRoles) && (
            <Button variant="contained" color="error" onClick={handleDeleteClick} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.delete')}</Button>
          )}
        </Box>
      </Box>
    )
  }

  // ===== RENDER: Create / Edit =====
  const formFields = [
    { label: t('wem.factorName'), node: <TextField size="small" fullWidth value={formData.factorName} onChange={(e) => setFormData({ ...formData, factorName: e.target.value })} /> },
    { label: t('wem.factorNameEn'), node: <TextField size="small" fullWidth value={formData.factorNameEn || ''} onChange={(e) => setFormData({ ...formData, factorNameEn: e.target.value })} /> },
    { label: t('wem.casNumber'), node: <TextField size="small" fullWidth value={formData.casNumber || ''} onChange={(e) => setFormData({ ...formData, casNumber: e.target.value })} /> },
    { label: t('wem.factorType'), node: (
      <Select size="small" fullWidth value={formData.factorType || ''} onChange={(e) => setFormData({ ...formData, factorType: e.target.value })} displayEmpty>
        <MenuItem value="" disabled>선택하세요</MenuItem>
        {hazardTypeCodes.map(c => <MenuItem key={c.code} value={c.code}>{getHazardTypeLabel(c.code)}</MenuItem>)}
      </Select>
    ) },
    { label: t('wem.twa'), node: <TextField size="small" fullWidth value={formData.twa || ''} onChange={(e) => setFormData({ ...formData, twa: e.target.value })} /> },
    { label: t('wem.stel'), node: <TextField size="small" fullWidth value={formData.stel || ''} onChange={(e) => setFormData({ ...formData, stel: e.target.value })} /> },
    { label: t('wem.ceiling'), node: <TextField size="small" fullWidth value={formData.ceilingValue || ''} onChange={(e) => setFormData({ ...formData, ceilingValue: e.target.value })} /> },
    { label: t('wem.unit'), node: <TextField size="small" fullWidth value={formData.unit || ''} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} /> },
    { label: t('wem.msdsLinked'), node: (
      <FormControlLabel
        control={
          <Switch
            checked={formData.msdsLinked || false}
            onChange={(e) => setFormData({ ...formData, msdsLinked: e.target.checked })}
          />
        }
        label={formData.msdsLinked ? t('wem.msdsLinkedYes', '연동') : t('wem.msdsLinkedNo', '미등록')}
      />
    ) },
    { label: t('wem.isPermitted'), node: (
      <FormControlLabel
        control={
          <Switch
            checked={formData.isPermitted || false}
            onChange={(e) => setFormData({ ...formData, isPermitted: e.target.checked })}
          />
        }
        label={formData.isPermitted ? t('wem.permitted', '허가') : t('wem.notPermitted', '일반')}
      />
    ) },
    { label: t('wem.usedProcess'), node: <TextField size="small" fullWidth value={formData.usedProcess || ''} onChange={(e) => setFormData({ ...formData, usedProcess: e.target.value })} /> },
    { label: t('common.remarks', '비고'), node: <TextField size="small" fullWidth multiline rows={2} value={formData.remarks || ''} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} /> },
  ]
  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      {/* PC */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[0].label}</Box>
          <Box sx={valBorderSx}>{formFields[0].node}</Box>
          <Box sx={labelSx}>{formFields[1].label}</Box>
          <Box sx={valSx}>{formFields[1].node}</Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[2].label}</Box>
          <Box sx={valBorderSx}>{formFields[2].node}</Box>
          <Box sx={labelSx}>{formFields[3].label}</Box>
          <Box sx={valSx}>{formFields[3].node}</Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[4].label}</Box>
          <Box sx={valBorderSx}>{formFields[4].node}</Box>
          <Box sx={labelSx}>{formFields[5].label}</Box>
          <Box sx={valSx}>{formFields[5].node}</Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[6].label}</Box>
          <Box sx={valBorderSx}>{formFields[6].node}</Box>
          <Box sx={labelSx}>{formFields[7].label}</Box>
          <Box sx={valSx}>{formFields[7].node}</Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[8].label}</Box>
          <Box sx={valBorderSx}>{formFields[8].node}</Box>
          <Box sx={labelSx}>{formFields[9].label}</Box>
          <Box sx={valSx}>{formFields[9].node}</Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{formFields[10].label}</Box>
          <Box sx={valSx}>{formFields[10].node}</Box>
        </Box>
        <Box sx={lastRowSx}>
          <Box sx={labelSx}>{formFields[11].label}</Box>
          <Box sx={valSx}>{formFields[11].node}</Box>
        </Box>
      </Box>
      {/* Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {formFields.map((f, i) => (
          <Box key={i}>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{f.label}</Typography>
            {f.node}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.cancel', '취소')}
        </Button>
        {canSee(MENU, 'DETAIL', '저장', myRoles) && (
        <Button variant="contained" onClick={handleSubmit} sx={{ flex: { xs: 1, sm: 'none' } }}>
          {t('common.save', '저장')}
        </Button>
        )}
      </Box>
    </Box>
  )
}

export default WemFactorTab
