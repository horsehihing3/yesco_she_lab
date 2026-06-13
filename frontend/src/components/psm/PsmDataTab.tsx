import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Button, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, Pagination, CircularProgress, Alert, TextField, MenuItem, Select, FormControl, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DatePickerField from '../common/DatePickerField'
import NumberField from '../common/NumberField'
import LoadingOverlay from '../common/LoadingOverlay'
import { psmApi } from '../../api/psmApi'
import DevTestFillButton from '../common/DevTestFillButton'
import type { PsmCategory, PsmData } from '../../types/psm.types'
import { useAlert } from '../../contexts/AlertContext'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const CATS: { key: PsmCategory; label: string; color: 'primary' | 'warning' | 'success' | 'info' | 'error' | 'default' }[] = [
  { key: 'EQUIP',  label: '설비명세',     color: 'primary' },
  { key: 'CHEM',   label: '유해위험물질', color: 'warning' },
  { key: 'POWER',  label: '동력기계',     color: 'success' },
  { key: 'VESSEL', label: '장치·설비',    color: 'info' },
  { key: 'PIPE',   label: '배관·개스킷',  color: 'default' },
  { key: 'PSV',    label: '안전밸브·파열판', color: 'error' },
]

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  NORMAL: 'success', PLAN: 'warning', ABNORMAL: 'error', EXPIRED: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  NORMAL: '정상', PLAN: '점검예정', ABNORMAL: '이상', EXPIRED: '만료',
}

const emptyForm = (cat: PsmCategory): Partial<PsmData> => ({
  category: cat, code: '', nameKo: '', statusCode: 'NORMAL',
})

const PsmDataTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [category, setCategory] = useState<PsmCategory>('EQUIP')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState<Partial<PsmData>>(emptyForm(category))

  const { data, isLoading } = useQuery({
    queryKey: ['psm-data', category, page],
    queryFn: () => psmApi.listData(category, page, 20),
    enabled: viewMode === 'list',
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['psm-data-detail', selectedId],
    queryFn: () => psmApi.getData(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const createMut = useMutation({
    mutationFn: (d: Partial<PsmData>) => psmApi.createData(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-data'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.saved', '저장되었습니다')); handleBackToList() },
    onError: () => showError(t('common.error', '오류가 발생했습니다')),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Partial<PsmData> }) => psmApi.updateData(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-data'] }); qc.invalidateQueries({ queryKey: ['psm-data-detail'] }); showSuccess(t('common.saved')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => psmApi.deleteData(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-data'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.deleted', '삭제되었습니다')); handleBackToList() },
  })

  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBackToList = () => { setViewMode('list'); setSelectedId(null); setForm(emptyForm(category)) }
  const handleRowClick = (item: PsmData) => { setSelectedId(item.id); setViewMode('detail') }
  const handleAddClick = () => { setSelectedId(null); setForm(emptyForm(category)); setViewMode('create') }
  const handleEditClick = () => {
    if (!detail) return
    setForm({ ...detail })
    setViewMode('edit')
  }
  const handleSave = async () => {
    if (!form.code?.trim()) { showError(t('psmDataTab.msg1', '번호를 입력해 주세요.')); return }
    if (!form.nameKo?.trim()) { showError(t('psmDataTab.msg2', '명칭을 입력해 주세요.')); return }
    const ok = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!ok) return
    if (selectedId) updateMut.mutate({ id: selectedId, d: form })
    else createMut.mutate(form)
  }
  const handleDelete = async () => {
    if (!selectedId) return
    const ok = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
    if (ok) deleteMut.mutate(selectedId)
  }

  const items = useMemo(() => {
    let list = data?.content || []
    if (searchText) {
      const s = searchText.toLowerCase()
      list = list.filter(i => i.code?.toLowerCase().includes(s) || i.nameKo?.toLowerCase().includes(s) || i.location?.toLowerCase().includes(s))
    }
    if (statusFilter) list = list.filter(i => i.statusCode === statusFilter)
    return list
  }, [data, searchText, statusFilter])

  const renderStatus = (s?: string | null) => s ? <Chip size="small" label={STATUS_LABEL[s] || s} color={STATUS_COLOR[s] || 'default'} /> : null

  // ─── LIST ───
  if (viewMode === 'list') {
    return (
      <Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {CATS.map(c => (
            <Chip key={c.key} label={c.label} color={c.key === category ? c.color : 'default'}
              variant={c.key === category ? 'filled' : 'outlined'}
              onClick={() => { setCategory(c.key); setPage(0); setStatusFilter(''); setSearchText('') }}
              sx={{ cursor: 'pointer' }} />
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select displayEmpty value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">{t('common.all', '전체 상태')}</MenuItem>
              <MenuItem value="NORMAL">정상</MenuItem>
              <MenuItem value="PLAN">점검예정</MenuItem>
              <MenuItem value="ABNORMAL">이상</MenuItem>
              <MenuItem value="EXPIRED">만료</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" placeholder="번호/명칭/위치 검색" value={searchText} onChange={e => setSearchText(e.target.value)} sx={{ minWidth: 220 }} />
          <IconButton size="small" onClick={() => { setSearchText(''); setStatusFilter('') }}><RefreshIcon /></IconButton>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>{t('common.new', '신규 등록')}</Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info">{t('common.noData', '데이터가 없습니다')}</Alert>
        ) : (
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>번호</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>명칭</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>형식</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>위치</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">담당자</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">다음 검사일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">상태</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.code}</TableCell>
                      <TableCell>{item.nameKo}</TableCell>
                      <TableCell>{item.typeLabel || '-'}</TableCell>
                      <TableCell>{item.location || '-'}</TableCell>
                      <TableCell align="center">{item.managerName || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.nextInspectionDate || '-'}</TableCell>
                      <TableCell align="center">{renderStatus(item.statusCode)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {data && data.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination count={data.totalPages} page={page + 1} onChange={(_, v) => setPage(v - 1)} />
          </Box>
        )}
      </Box>
    )
  }

  // ─── DETAIL / CREATE / EDIT ───
  if (viewMode === 'detail' && (detailLoading || !detail)) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  const isEditMode = viewMode === 'edit' || viewMode === 'create'
  const view = isEditMode ? form : (detail || {})
  const setV = (patch: Partial<PsmData>) => setForm(f => ({ ...f, ...patch }))
  const fillTestData = () => setForm(prev => {
    const next: Partial<PsmData> = {
      ...prev,
      inspectionCycle: prev.inspectionCycle || '1년',
      managerName: prev.managerName || '담당자',
      lastInspectionDate: prev.lastInspectionDate || '2026-01-15',
      nextInspectionDate: prev.nextInspectionDate || '2027-01-15',
      notes: prev.notes || '정기 점검 결과 이상 없음',
    }
    if (category === 'CHEM') {
      next.code = prev.code || 'CHEM-001'
      next.nameKo = prev.nameKo || '톨루엔'
      next.typeLabel = prev.typeLabel || '인화성 액체'
      next.casNumber = prev.casNumber || '108-88-3'
      next.ghsClass = prev.ghsClass || '인화성 액체 구분2'
      next.regulatedQtyKg = prev.regulatedQtyKg ?? 10000
      next.holdingQtyKg = prev.holdingQtyKg ?? 3500
      next.psmTarget = prev.psmTarget ?? true
    } else {
      next.code = prev.code || 'EQ-V-201'
      next.nameKo = prev.nameKo || '저장탱크 T-201'
      next.typeLabel = prev.typeLabel || '입형 원통형'
      next.location = prev.location || '제1공장 저장구역'
      next.manufacturer = prev.manufacturer || '대한중공업'
      next.designPressure = prev.designPressure || '15 barg'
      next.designTemperature = prev.designTemperature || '250°C'
      next.material = prev.material || 'SUS316'
      next.installDate = prev.installDate || '2020-03-01'
      if (category === 'PSV') {
        next.setPressure = prev.setPressure || '12 barg'
        next.protectedEquip = prev.protectedEquip || '저장탱크 T-201'
      }
    }
    return next
  })
  const showChemFields = category === 'CHEM'
  const showPsvFields = category === 'PSV'

  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        {CATS.find(c => c.key === category)?.label} — {viewMode === 'create' ? '신규 등록' : viewMode === 'edit' ? '수정' : '상세'}
      </Typography>

      <FormTable>
        <FormRow>
          <FormLabel required>번호</FormLabel>
          <FormCell borderRight>
            {isEditMode ? <TextField fullWidth size="small" value={view.code || ''} onChange={e => setV({ code: e.target.value })} />
              : <Typography variant="body2" fontFamily="monospace">{view.code || ''}</Typography>}
          </FormCell>
          <FormLabel required>명칭</FormLabel>
          <FormCell>
            {isEditMode ? <TextField fullWidth size="small" value={view.nameKo || ''} onChange={e => setV({ nameKo: e.target.value })} />
              : <Typography variant="body2" fontWeight={600}>{view.nameKo || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>형식</FormLabel>
          <FormCell borderRight>
            {isEditMode ? <TextField fullWidth size="small" value={view.typeLabel || ''} onChange={e => setV({ typeLabel: e.target.value })} />
              : <Typography variant="body2">{view.typeLabel || ''}</Typography>}
          </FormCell>
          <FormLabel>상태</FormLabel>
          <FormCell>
            {isEditMode ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={view.statusCode || ''} onChange={e => setV({ statusCode: e.target.value })}>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  <MenuItem value="NORMAL">정상</MenuItem>
                  <MenuItem value="PLAN">점검예정</MenuItem>
                  <MenuItem value="ABNORMAL">이상</MenuItem>
                  <MenuItem value="EXPIRED">만료</MenuItem>
                </Select>
              </FormControl>
            ) : renderStatus(view.statusCode)}
          </FormCell>
        </FormRow>
        {!showChemFields && !showPsvFields && (
          <FormRow>
            <FormLabel>위치/기능위치</FormLabel>
            <FormCell borderRight>
              {isEditMode ? <TextField fullWidth size="small" value={view.location || ''} onChange={e => setV({ location: e.target.value })} />
                : <Typography variant="body2">{view.location || ''}</Typography>}
            </FormCell>
            <FormLabel>제조사</FormLabel>
            <FormCell>
              {isEditMode ? <TextField fullWidth size="small" value={view.manufacturer || ''} onChange={e => setV({ manufacturer: e.target.value })} />
                : <Typography variant="body2">{view.manufacturer || ''}</Typography>}
            </FormCell>
          </FormRow>
        )}
        {!showChemFields && (
          <FormRow>
            <FormLabel>설계 압력</FormLabel>
            <FormCell borderRight>
              {isEditMode ? <TextField fullWidth size="small" value={view.designPressure || ''} onChange={e => setV({ designPressure: e.target.value })} placeholder="예: 15 barg" />
                : <Typography variant="body2">{view.designPressure || ''}</Typography>}
            </FormCell>
            <FormLabel>설계 온도</FormLabel>
            <FormCell>
              {isEditMode ? <TextField fullWidth size="small" value={view.designTemperature || ''} onChange={e => setV({ designTemperature: e.target.value })} placeholder="예: 250°C" />
                : <Typography variant="body2">{view.designTemperature || ''}</Typography>}
            </FormCell>
          </FormRow>
        )}
        {!showChemFields && (
          <FormRow>
            <FormLabel>재질</FormLabel>
            <FormCell borderRight>
              {isEditMode ? <TextField fullWidth size="small" value={view.material || ''} onChange={e => setV({ material: e.target.value })} />
                : <Typography variant="body2">{view.material || ''}</Typography>}
            </FormCell>
            <FormLabel>설치일</FormLabel>
            <FormCell>
              {isEditMode ? <DatePickerField value={view.installDate || null} onChange={d => setV({ installDate: d || undefined })} />
                : <Typography variant="body2" fontFamily="monospace">{view.installDate || ''}</Typography>}
            </FormCell>
          </FormRow>
        )}
        {showChemFields && (
          <>
            <FormRow>
              <FormLabel>CAS 번호</FormLabel>
              <FormCell borderRight>
                {isEditMode ? <TextField fullWidth size="small" value={view.casNumber || ''} onChange={e => setV({ casNumber: e.target.value })} />
                  : <Typography variant="body2" fontFamily="monospace">{view.casNumber || ''}</Typography>}
              </FormCell>
              <FormLabel>GHS 등급</FormLabel>
              <FormCell>
                {isEditMode ? <TextField fullWidth size="small" value={view.ghsClass || ''} onChange={e => setV({ ghsClass: e.target.value })} />
                  : <Typography variant="body2">{view.ghsClass || ''}</Typography>}
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>PSM 규정량(kg)</FormLabel>
              <FormCell borderRight>
                {isEditMode ? <NumberField fullWidth value={view.regulatedQtyKg ?? null} onChange={v => setV({ regulatedQtyKg: v ?? undefined })} />
                  : <Typography variant="body2">{view.regulatedQtyKg ?? ''}</Typography>}
              </FormCell>
              <FormLabel>보유량(kg)</FormLabel>
              <FormCell>
                {isEditMode ? <NumberField fullWidth value={view.holdingQtyKg ?? null} onChange={v => setV({ holdingQtyKg: v ?? undefined })} />
                  : <Typography variant="body2">{view.holdingQtyKg ?? ''}</Typography>}
              </FormCell>
            </FormRow>
            <FormRow>
              <FormLabel>PSM 대상</FormLabel>
              <FormCell>
                {isEditMode ? (
                  <FormControl fullWidth size="small">
                    <Select displayEmpty value={view.psmTarget === true ? '1' : view.psmTarget === false ? '0' : ''} onChange={e => setV({ psmTarget: e.target.value === '1' })}>
                      <MenuItem value="" disabled>선택하세요</MenuItem>
                      <MenuItem value="1">대상</MenuItem>
                      <MenuItem value="0">비대상</MenuItem>
                    </Select>
                  </FormControl>
                ) : <Typography variant="body2">{view.psmTarget ? '대상' : view.psmTarget === false ? '비대상' : ''}</Typography>}
              </FormCell>
            </FormRow>
          </>
        )}
        {showPsvFields && (
          <FormRow>
            <FormLabel>설정 압력</FormLabel>
            <FormCell borderRight>
              {isEditMode ? <TextField fullWidth size="small" value={view.setPressure || ''} onChange={e => setV({ setPressure: e.target.value })} placeholder="예: 12 barg" />
                : <Typography variant="body2">{view.setPressure || ''}</Typography>}
            </FormCell>
            <FormLabel>보호 설비</FormLabel>
            <FormCell>
              {isEditMode ? <TextField fullWidth size="small" value={view.protectedEquip || ''} onChange={e => setV({ protectedEquip: e.target.value })} />
                : <Typography variant="body2">{view.protectedEquip || ''}</Typography>}
            </FormCell>
          </FormRow>
        )}
        <FormRow>
          <FormLabel>검사 주기</FormLabel>
          <FormCell borderRight>
            {isEditMode ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={view.inspectionCycle || ''} onChange={e => setV({ inspectionCycle: e.target.value })}>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  <MenuItem value="3개월">3개월</MenuItem>
                  <MenuItem value="6개월">6개월</MenuItem>
                  <MenuItem value="1년">1년</MenuItem>
                  <MenuItem value="2년">2년</MenuItem>
                  <MenuItem value="3년">3년</MenuItem>
                </Select>
              </FormControl>
            ) : <Typography variant="body2">{view.inspectionCycle || ''}</Typography>}
          </FormCell>
          <FormLabel>담당자</FormLabel>
          <FormCell>
            {isEditMode ? <TextField fullWidth size="small" value={view.managerName || ''} onChange={e => setV({ managerName: e.target.value })} />
              : <Typography variant="body2">{view.managerName || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>최근 검사일</FormLabel>
          <FormCell borderRight>
            {isEditMode ? <DatePickerField value={view.lastInspectionDate || null} onChange={d => setV({ lastInspectionDate: d || undefined })} />
              : <Typography variant="body2" fontFamily="monospace">{view.lastInspectionDate || ''}</Typography>}
          </FormCell>
          <FormLabel>다음 검사일</FormLabel>
          <FormCell>
            {isEditMode ? <DatePickerField value={view.nextInspectionDate || null} onChange={d => setV({ nextInspectionDate: d || undefined })} />
              : <Typography variant="body2" fontFamily="monospace">{view.nextInspectionDate || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow last>
          <FormLabel>비고</FormLabel>
          <FormCell>
            {isEditMode ? <TextField fullWidth size="small" multiline minRows={2} value={view.notes || ''} onChange={e => setV({ notes: e.target.value })} />
              : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{view.notes || ''}</Typography>}
          </FormCell>
        </FormRow>
      </FormTable>

      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list', '목록')}</Button>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
        {isEditMode ? (
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save', '저장')}</Button>
        ) : (
          <>
            <Button variant="contained" onClick={handleEditClick} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit', '수정')}</Button>
            <Button variant="contained" color="error" onClick={handleDelete} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete', '삭제')}</Button>
          </>
        )}
      </Box>
    </Box>
  )
}

export default PsmDataTab
