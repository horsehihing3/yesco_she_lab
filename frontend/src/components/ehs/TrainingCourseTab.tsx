import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Typography, Pagination,
  IconButton, CircularProgress, Alert, Chip, Select, MenuItem,
  FormControl, Grid, FormControlLabel, Checkbox,
} from '@mui/material'
import ListSearchBar from '../common/ListSearchBar'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../contexts/AlertContext'
import axiosInstance from '../../api/axiosInstance'
import { TrainingCourse, TrainingCourseRequest } from '../../types/trainingCourse.types'
import { ApiResponse, PageResponse } from '../../types/common.types'
import LoadingOverlay from '../common/LoadingOverlay'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import useCodeMap from '../../hooks/useCodeMap'
import DevTestFillButton from '../common/DevTestFillButton'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const fetchCourses = async (
  category: string,
  isActive: string,
  keyword: string,
  page: number,
  size: number,
): Promise<PageResponse<TrainingCourse>> => {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  if (category) params.set('category', category)
  if (isActive !== '') params.set('isActive', isActive)
  if (keyword) params.set('keyword', keyword)
  const res = await axiosInstance.get<ApiResponse<PageResponse<TrainingCourse>>>(`/training-course?${params.toString()}`)
  return res.data.data
}
const fetchCourseDetail = async (id: number): Promise<TrainingCourse> => {
  const res = await axiosInstance.get<ApiResponse<TrainingCourse>>(`/training-course/${id}`)
  return res.data.data
}
const createCourse = async (data: TrainingCourseRequest): Promise<TrainingCourse> => {
  const res = await axiosInstance.post<ApiResponse<TrainingCourse>>('/training-course', data)
  return res.data.data
}
const updateCourse = async ({ id, data }: { id: number; data: TrainingCourseRequest }): Promise<TrainingCourse> => {
  const res = await axiosInstance.put<ApiResponse<TrainingCourse>>(`/training-course/${id}`, data)
  return res.data.data
}
const deleteCourse = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/training-course/${id}`)
}

const labelSx = {
  width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100',
  px: 2, py: 1.5, borderRight: 1, borderColor: 'divider',
  display: 'flex', alignItems: 'center', fontSize: '0.875rem',
  justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center',
}
const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'divider' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }
const lastRowSx = { display: 'flex', borderColor: 'divider' }

const TrainingCourseTab: React.FC = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { showWarning, showSuccess, showConfirm } = useAlert()
  const { codeList: categoryCodes, getLabel: getCategoryLabel } = useCodeMap('TRAINING_CATEGORY')
  const { codeList: cycleCodes, getLabel: getCycleLabel } = useCodeMap('TRAINING_CYCLE')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<TrainingCourse | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const emptyForm: TrainingCourseRequest = {
    courseCode: '',
    courseName: '',
    category: 'OTHER',
    catType: 'safety',
    durationHours: 0,
    legalRequired: false,
    mode: 'CLASSROOM',
    status: 'OPEN',
    totalSeats: 30,
    currentSeats: 0,
    isActive: true,
  }
  const [formData, setFormData] = useState<TrainingCourseRequest>(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['trainingCourse', categoryFilter, activeFilter, searchQuery, page],
    queryFn: () => fetchCourses(categoryFilter, activeFilter, searchQuery, page, rowsPerPage),
    enabled: viewMode === 'list',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['trainingCourseDetail', selectedItem?.id],
    queryFn: () => fetchCourseDetail(selectedItem!.id),
    enabled: !!selectedItem?.id && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['trainingCourse'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })
  const updateMutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['trainingCourse'] })
      queryClient.invalidateQueries({ queryKey: ['trainingCourseDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
      handleBackToList()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['trainingCourse'] })
      await showSuccess(t('common.deleted', '삭제되었습니다'))
      handleBackToList()
    },
  })
  const isProcessing = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const handleBackToList = () => {
    setViewMode('list'); setSelectedItem(null); setFormData({ ...emptyForm })
  }
  const handleReset = () => {
    setSearchText(''); setSearchQuery(''); setCategoryFilter(''); setActiveFilter(''); setPage(0)
  }
  const handleSearch = () => { setSearchQuery(searchText); setPage(0) }
  const handleRowClick = (item: TrainingCourse) => { setSelectedItem(item); setViewMode('detail') }
  const handleAddClick = () => { setSelectedItem(null); setFormData({ ...emptyForm }); setViewMode('create') }
  const handleEditClick = () => {
    if (!detail) return
    setFormData({
      courseCode: detail.courseCode,
      courseName: detail.courseName,
      category: detail.category || 'OTHER',
      catType: detail.catType || 'safety',
      targetAudience: detail.targetAudience || '',
      durationHours: detail.durationHours || 0,
      cycle: detail.cycle || '',
      legalRequired: detail.legalRequired,
      instructor: detail.instructor || '',
      description: detail.description || '',
      dateStart: detail.dateStart || '',
      dateEnd: detail.dateEnd || '',
      location: detail.location || '',
      mode: detail.mode || 'CLASSROOM',
      status: detail.status || 'OPEN',
      totalSeats: detail.totalSeats || 30,
      currentSeats: detail.currentSeats || 0,
      lawBasis: detail.lawBasis || '',
      isActive: detail.isActive,
    })
    setViewMode('edit')
  }
  const handleDeleteClick = async () => {
    if (!selectedItem) return
    const ok = await showConfirm(
      `${t('common.confirmDeleteMessage', '삭제하시겠습니까?')}\n${t('common.deleteWarning', '이 작업은 되돌릴 수 없습니다.')}`,
      { title: t('common.delete', '삭제') }
    )
    if (ok) deleteMutation.mutate(selectedItem.id)
  }
  // DEV ONLY — 비어있는 항목을 교육 과정 더미데이터로 채움 (입력값 보존)
  const fillTestData = () => {
    const today = new Date().toISOString().slice(0, 10)
    setFormData(prev => ({
      ...prev,
      courseCode: prev.courseCode || 'TC-2026-001',
      courseName: prev.courseName || '관리감독자 정기 안전보건교육',
      targetAudience: prev.targetAudience || '생산팀 관리감독자',
      instructor: prev.instructor || '정유정',
      durationHours: prev.durationHours || 16,
      cycle: prev.cycle || (cycleCodes[0]?.code ?? prev.cycle),
      dateStart: prev.dateStart || today,
      dateEnd: prev.dateEnd || today,
      location: prev.location || '본사 3층 교육장',
      lawBasis: prev.lawBasis || '산업안전보건법 제29조',
      description: prev.description || '관리감독자 대상 법정 정기교육 (테스트 데이터)',
    }))
  }

  const handleSubmit = async () => {
    if (!formData.courseCode?.trim()) {
      showWarning(t('trainingCourse.courseCode', '과정코드') + ' ' + t('common.required', '필수입니다'))
      return
    }
    if (!formData.courseName?.trim()) {
      showWarning(t('trainingCourse.courseName', '과정명') + ' ' + t('common.required', '필수입니다'))
      return
    }
    const ok = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!ok) return
    if (viewMode === 'create') createMutation.mutate(formData)
    else if (viewMode === 'edit' && selectedItem) updateMutation.mutate({ id: selectedItem.id, data: formData })
  }

  const items = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalCount = data?.totalElements ?? items.length
  const activeCount = items.filter(i => i.isActive).length
  const legalCount = items.filter(i => i.legalRequired).length

  if (viewMode === 'list') {
    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: t('trainingCourse.kpiTotal', '전체 과정'), value: totalCount, color: '#3b82f6' },
            { label: t('trainingCourse.kpiActive', '활성 과정'), value: activeCount, color: '#22c55e' },
            { label: t('trainingCourse.kpiLegal', '법정필수'),  value: legalCount, color: '#ef4444' },
          ].map((c, i) => (
            <Grid item xs={4} key={i}>
              <Paper sx={(theme: any) => ({ p: 2.5, pl: 3, position: 'relative', overflow: 'hidden', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }), '&::before': { content: '""', position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: theme.isYesco ? '#E60012' : '#2563eb', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' } })}>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                <Typography variant="h5" fontWeight="bold">{c.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }} displayEmpty>
              <MenuItem value="">{t('common.allCategory', '전체분류')}</MenuItem>
              {categoryCodes.map(c => <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(0) }} displayEmpty>
              <MenuItem value="">{t('common.all', '전체')}</MenuItem>
              <MenuItem value="true">{t('common.active', '활성')}</MenuItem>
              <MenuItem value="false">{t('common.inactive', '비활성')}</MenuItem>
            </Select>
          </FormControl>
          <ListSearchBar
            placeholder={t('trainingCourse.searchPh', '과정명/코드')}
            value={searchText}
            onChange={setSearchText}
            onSearch={handleSearch}
            sx={{ minWidth: 200 }}
          />
          <IconButton onClick={handleReset} size="small"><RefreshIcon /></IconButton>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="small">
            {t('common.new', '신규')}
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info">{t('common.noData', '데이터가 없습니다')}</Alert>
        ) : (
          <>
            <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={hSx} align="center">{t('common.no', 'No')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('trainingCourse.courseCode', '코드')}</TableCell>
                    <TableCell sx={hSx}>{t('trainingCourse.courseName', '과정명')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('trainingCourse.category', '분류')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('trainingCourse.target', '대상')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('trainingCourse.durationHours', '시간')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('trainingCourse.cycle', '주기')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('trainingCourse.legalRequired', '법정필수')}</TableCell>
                    <TableCell sx={hSx} align="center">{t('trainingCourse.isActive', '활성')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell align="center">{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell align="center"><code>{item.courseCode}</code></TableCell>
                      <TableCell>{item.courseName}</TableCell>
                      <TableCell align="center">
                        {item.category && <Chip label={getCategoryLabel(item.category) || item.category} size="small" variant="outlined"/>}
                      </TableCell>
                      <TableCell align="center">{item.targetAudience || ''}</TableCell>
                      <TableCell align="center">{item.durationHours || 0}h</TableCell>
                      <TableCell align="center">{item.cycle ? (getCycleLabel(item.cycle) || item.cycle) : ''}</TableCell>
                      <TableCell align="center">
                        {item.legalRequired ? <Chip label={t('common.required', '필수')} color="error" size="small"/> : ''}
                      </TableCell>
                      <TableCell align="center">
                        {item.isActive
                          ? <Chip label={t('common.active', '활성')} color="success" size="small"/>
                          : <Chip label={t('common.inactive', '비활성')} size="small"/>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} />
              </Box>
            )}
          </>
        )}
      </Box>
    )
  }

  if (viewMode === 'detail') {
    if (detailLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
    const d = detail
    if (!d) return <Alert severity="error">{t('common.noData', '데이터가 없습니다')}</Alert>
    return (
      <Box>
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('trainingCourse.courseCode', '코드')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2"><code>{d.courseCode}</code></Typography></Box>
            <Box sx={labelSx}>{t('trainingCourse.category', '분류')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.category ? (getCategoryLabel(d.category) || d.category) : ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('trainingCourse.courseName', '과정명')}</Box>
            <Box sx={{ ...valSx, flex: 3 }}><Typography variant="body2">{d.courseName}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('trainingCourse.target', '대상')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.targetAudience || ''}</Typography></Box>
            <Box sx={labelSx}>{t('trainingCourse.instructor', '강사')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.instructor || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('trainingCourse.durationHours', '시간')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{d.durationHours || 0}h</Typography></Box>
            <Box sx={labelSx}>{t('trainingCourse.cycle', '주기')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.cycle ? (getCycleLabel(d.cycle) || d.cycle) : ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('trainingCourse.legalRequired', '법정필수')}</Box>
            <Box sx={valBorderSx}>
              {d.legalRequired ? <Chip label={t('common.required', '필수')} color="error" size="small"/> : ''}
            </Box>
            <Box sx={labelSx}>{t('trainingCourse.isActive', '활성')}</Box>
            <Box sx={valSx}>
              {d.isActive ? <Chip label={t('common.active', '활성')} color="success" size="small"/>
                          : <Chip label={t('common.inactive', '비활성')} size="small"/>}
            </Box>
          </Box>
          <Box sx={lastRowSx}>
            <Box sx={labelSx}>{t('common.description', '설명')}</Box>
            <Box sx={{ ...valSx, flex: 3 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{d.description || ''}</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={handleBackToList}>{t('common.backToList', '목록')}</Button>
          <Button variant="contained" onClick={handleEditClick}>{t('common.edit', '수정')}</Button>
          <Button variant="contained" color="error" onClick={handleDeleteClick}>{t('common.delete', '삭제')}</Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('trainingCourse.courseCode', '코드')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={valBorderSx}>
            <TextField size="small" fullWidth value={formData.courseCode}
              onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}/>
          </Box>
          <Box sx={labelSx}>{t('trainingCourse.category', '분류')}</Box>
          <Box sx={valSx}>
            <Select size="small" fullWidth value={formData.category || 'OTHER'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {categoryCodes.map(c => <MenuItem key={c.code} value={c.code}>{getCategoryLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('trainingCourse.courseName', '과정명')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Box>
          <Box sx={{ ...valSx, flex: 3 }}>
            <TextField size="small" fullWidth value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}/>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('trainingCourse.target', '대상')}</Box>
          <Box sx={valBorderSx}>
            <TextField size="small" fullWidth value={formData.targetAudience || ''}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}/>
          </Box>
          <Box sx={labelSx}>{t('trainingCourse.instructor', '강사')}</Box>
          <Box sx={valSx}>
            <TextField size="small" fullWidth value={formData.instructor || ''}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}/>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('trainingCourse.durationHours', '시간')}</Box>
          <Box sx={valBorderSx}>
            <NumberField value={formData.durationHours ?? 0} min={0}
              onChange={(v) => setFormData({ ...formData, durationHours: v ?? 0 })}/>
          </Box>
          <Box sx={labelSx}>{t('trainingCourse.cycle', '주기')}</Box>
          <Box sx={valSx}>
            <Select size="small" fullWidth value={formData.cycle || ''}
              onChange={(e) => setFormData({ ...formData, cycle: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              {cycleCodes.map(c => <MenuItem key={c.code} value={c.code}>{getCycleLabel(c.code)}</MenuItem>)}
            </Select>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('trainingCourse.dateStart', '시작일')}</Box>
          <Box sx={valBorderSx}>
            <DatePickerField value={formData.dateStart || ''}
              onChange={(v) => setFormData({ ...formData, dateStart: v })}
              maxDate={formData.dateEnd} />
          </Box>
          <Box sx={labelSx}>{t('trainingCourse.dateEnd', '종료일')}</Box>
          <Box sx={valSx}>
            <DatePickerField value={formData.dateEnd || ''}
              onChange={(v) => setFormData({ ...formData, dateEnd: v })}
              minDate={formData.dateStart} />
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('trainingCourse.location', '장소')}</Box>
          <Box sx={valBorderSx}>
            <TextField size="small" fullWidth value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}/>
          </Box>
          <Box sx={labelSx}>{t('trainingCourse.mode', '방식')}</Box>
          <Box sx={valSx}>
            <Select size="small" fullWidth value={formData.mode || 'CLASSROOM'}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              <MenuItem value="CLASSROOM">{t('training.modeClassroom', '집합교육')}</MenuItem>
              <MenuItem value="ONLINE">{t('training.modeOnline', '온라인')}</MenuItem>
              <MenuItem value="HYBRID">{t('training.modeHybrid', '혼합형')}</MenuItem>
            </Select>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('trainingCourse.totalSeats', '정원')}</Box>
          <Box sx={valBorderSx}>
            <NumberField value={formData.totalSeats ?? 30} min={1}
              onChange={(v) => setFormData({ ...formData, totalSeats: v ?? 0 })}/>
          </Box>
          <Box sx={labelSx}>{t('trainingCourse.status', '모집상태')}</Box>
          <Box sx={valSx}>
            <Select size="small" fullWidth value={formData.status || 'OPEN'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              <MenuItem value="OPEN">{t('training.statusOpen', '모집중')}</MenuItem>
              <MenuItem value="CLOSED">{t('training.statusClosed', '마감')}</MenuItem>
              <MenuItem value="PREPARING">{t('training.statusPreparing', '준비중')}</MenuItem>
              <MenuItem value="ENDED">{t('training.statusEnded', '종료')}</MenuItem>
            </Select>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('trainingCourse.lawBasis', '근거법령')}</Box>
          <Box sx={valBorderSx}>
            <TextField size="small" fullWidth value={formData.lawBasis || ''}
              onChange={(e) => setFormData({ ...formData, lawBasis: e.target.value })}/>
          </Box>
          <Box sx={labelSx}>{t('trainingCourse.catType', '카테고리')}</Box>
          <Box sx={valSx}>
            <Select size="small" fullWidth value={formData.catType || 'safety'}
              onChange={(e) => setFormData({ ...formData, catType: e.target.value })} displayEmpty>
              <MenuItem value="" disabled>선택하세요</MenuItem>
              <MenuItem value="safety">{t('training.catSafety', '안전')}</MenuItem>
              <MenuItem value="health">{t('training.catHealth', '보건')}</MenuItem>
              <MenuItem value="environment">{t('training.catEnvironment', '환경')}</MenuItem>
              <MenuItem value="special">{t('training.catSpecial', '특별')}</MenuItem>
              <MenuItem value="manager">{t('training.catManager', '관리감독자')}</MenuItem>
            </Select>
          </Box>
        </Box>
        <Box sx={rowSx}>
          <Box sx={labelSx}>{t('trainingCourse.legalRequired', '법정필수')}</Box>
          <Box sx={valBorderSx}>
            <FormControlLabel
              control={<Checkbox checked={!!formData.legalRequired}
                onChange={(e) => setFormData({ ...formData, legalRequired: e.target.checked })} />}
              label={t('common.required', '필수')}
            />
          </Box>
          <Box sx={labelSx}>{t('trainingCourse.isActive', '활성')}</Box>
          <Box sx={valSx}>
            <FormControlLabel
              control={<Checkbox checked={formData.isActive !== false}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />}
              label={t('common.active', '활성')}
            />
          </Box>
        </Box>
        <Box sx={lastRowSx}>
          <Box sx={labelSx}>{t('common.description', '설명')}</Box>
          <Box sx={{ ...valSx, flex: 3 }}>
            <TextField size="small" fullWidth multiline rows={3} value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}/>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
        <Button variant="outlined" onClick={handleBackToList}>
          {t('common.cancel', '취소')}
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          {t('common.save', '저장')}
        </Button>
      </Box>
    </Box>
  )
}

export default TrainingCourseTab
