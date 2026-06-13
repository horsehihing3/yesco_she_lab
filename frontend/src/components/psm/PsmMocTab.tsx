import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Button, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, Pagination, CircularProgress, Alert, TextField, MenuItem, Select, FormControl,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DatePickerField from '../common/DatePickerField'
import LoadingOverlay from '../common/LoadingOverlay'
import { psmApi } from '../../api/psmApi'
import DevTestFillButton from '../common/DevTestFillButton'
import type { PsmMoc, MocStatus } from '../../types/psm.types'
import { useAlert } from '../../contexts/AlertContext'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const STATUS: { code: MocStatus; label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error' }[] = [
  { code: 'DRAFT',      label: '작성중',         color: 'default' },
  { code: 'REVIEWING',  label: '위험성 검토',    color: 'info' },
  { code: 'APPROVING',  label: '승인 진행',      color: 'warning' },
  { code: 'EDUCATING',  label: '교육 진행',      color: 'info' },
  { code: 'EXECUTING',  label: '실행 중',        color: 'warning' },
  { code: 'PSSR',       label: 'PSSR 진행',      color: 'info' },
  { code: 'DONE',       label: '완료',           color: 'success' },
  { code: 'REJECTED',   label: '반려',           color: 'error' },
]
const sl = (c?: string | null) => STATUS.find(s => s.code === c)?.label || c || ''
const sc = (c?: string | null) => STATUS.find(s => s.code === c)?.color || 'default'

const CHANGE_TYPES = [
  { v: 'PROCESS',   l: '공정 변경' },
  { v: 'EQUIP',     l: '설비 변경' },
  { v: 'MATERIAL',  l: '물질 변경' },
  { v: 'PROCEDURE', l: '절차 변경' },
]

const emptyForm = (): Partial<PsmMoc> => ({
  changeType: 'PROCESS', status: 'DRAFT', title: '',
})

const PsmMocTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [form, setForm] = useState<Partial<PsmMoc>>(emptyForm())

  const { data, isLoading } = useQuery({
    queryKey: ['psm-moc', page],
    queryFn: () => psmApi.listMoc(page, 20),
    enabled: viewMode === 'list',
  })
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['psm-moc-detail', selectedId],
    queryFn: () => psmApi.getMoc(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const createMut = useMutation({
    mutationFn: (m: Partial<PsmMoc>) => psmApi.createMoc(m),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-moc'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.saved')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, m }: { id: number; m: Partial<PsmMoc> }) => psmApi.updateMoc(id, m),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-moc'] }); qc.invalidateQueries({ queryKey: ['psm-moc-detail'] }); showSuccess(t('common.saved')); handleBackToList() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => psmApi.deleteMoc(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-moc'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.deleted')); handleBackToList() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBackToList = () => { setViewMode('list'); setSelectedId(null); setForm(emptyForm()) }
  const handleRowClick = (item: PsmMoc) => { setSelectedId(item.id); setViewMode('detail') }
  const handleAddClick = () => { setSelectedId(null); setForm(emptyForm()); setViewMode('create') }
  const handleEditClick = () => { if (detail) { setForm({ ...detail }); setViewMode('edit') } }
  const handleSave = async () => {
    if (!form.title?.trim()) { showError(t('psmMocTab.msg1', '변경 제목을 입력해 주세요.')); return }
    if (!form.changeType) { showError(t('psmMocTab.msg2', '변경 유형을 선택해 주세요.')); return }
    const ok = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!ok) return
    if (selectedId) updateMut.mutate({ id: selectedId, m: form })
    else createMut.mutate(form)
  }
  const handleDelete = async () => {
    if (!selectedId) return
    const ok = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
    if (ok) deleteMut.mutate(selectedId)
  }

  // ─── LIST ───
  if (viewMode === 'list') {
    const items = data?.content || []
    return (
      <Box>
        <Box sx={{ display: 'flex', mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold">{t('psmMocTab.section1', '변경관리 (MOC)')}</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>{t('common.new', '신규 등록')}</Button>
        </Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info">{t('common.noData')}</Alert>
        ) : (
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>MOC 번호</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>변경 유형</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>제목</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">요청자</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">요청일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">목표일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">상태</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map(m => (
                    <TableRow key={m.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(m)}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{m.mocNo}</TableCell>
                      <TableCell>{CHANGE_TYPES.find(c => c.v === m.changeType)?.l || m.changeType}</TableCell>
                      <TableCell>{m.title}</TableCell>
                      <TableCell align="center">{m.requesterName || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{m.requestDate || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{m.targetDate || '-'}</TableCell>
                      <TableCell align="center"><Chip size="small" label={sl(m.status)} color={sc(m.status)} /></TableCell>
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

  // ─── DETAIL / EDIT / CREATE ───
  if (viewMode === 'detail' && (detailLoading || !detail)) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }
  const isEdit = viewMode === 'edit' || viewMode === 'create'
  const v = isEdit ? form : (detail || {})
  const setV = (patch: Partial<PsmMoc>) => setForm(f => ({ ...f, ...patch }))
  const fillTestData = () => setForm(prev => ({
    ...prev,
    title: prev.title || '반응공정 운전온도 상향 변경',
    requesterName: prev.requesterName || '한요청',
    requesterDept: prev.requesterDept || '공정기술팀',
    requestDate: prev.requestDate || '2026-06-10',
    targetDate: prev.targetDate || '2026-07-31',
    reason: prev.reason || '생산성 향상을 위해 반응기 R-101 운전온도를 180도에서 200도로 상향 조정',
    scope: prev.scope || '반응기 R-101 및 관련 온도 제어 설비, 운전 절차서',
    riskMethod: prev.riskMethod || 'HAZOP',
    riskResult: prev.riskResult || 'CONDITIONAL',
    riskReviewDate: prev.riskReviewDate || '2026-06-12',
    riskOpinion: prev.riskOpinion || '온도 상한 경보 설정값 조정 및 PSV 용량 재검토를 조건으로 승인',
  }))

  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        MOC {viewMode === 'create' ? '신규 등록' : viewMode === 'edit' ? '수정' : '상세'}
      </Typography>

      <FormTable>
        <FormRow>
          <FormLabel>MOC 번호</FormLabel>
          <FormCell borderRight>
            <Typography variant="body2" fontFamily="monospace">{v.mocNo || (viewMode === 'create' ? '자동 생성' : '')}</Typography>
          </FormCell>
          <FormLabel required>변경 유형</FormLabel>
          <FormCell>
            {isEdit ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={v.changeType || ''} onChange={e => setV({ changeType: e.target.value as PsmMoc['changeType'] })}>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {CHANGE_TYPES.map(c => <MenuItem key={c.v} value={c.v}>{c.l}</MenuItem>)}
                </Select>
              </FormControl>
            ) : <Typography variant="body2">{CHANGE_TYPES.find(c => c.v === v.changeType)?.l || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel required>변경 제목</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.title || ''} onChange={e => setV({ title: e.target.value })} />
              : <Typography variant="body2" fontWeight={600}>{v.title || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>요청자</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" value={v.requesterName || ''} onChange={e => setV({ requesterName: e.target.value })} />
              : <Typography variant="body2">{v.requesterName || ''}</Typography>}
          </FormCell>
          <FormLabel>요청 부서</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.requesterDept || ''} onChange={e => setV({ requesterDept: e.target.value })} />
              : <Typography variant="body2">{v.requesterDept || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>요청일</FormLabel>
          <FormCell borderRight>
            {isEdit ? <DatePickerField value={v.requestDate || null} onChange={d => setV({ requestDate: d || undefined })} />
              : <Typography variant="body2" fontFamily="monospace">{v.requestDate || ''}</Typography>}
          </FormCell>
          <FormLabel>완료 목표일</FormLabel>
          <FormCell>
            {isEdit ? <DatePickerField value={v.targetDate || null} onChange={d => setV({ targetDate: d || undefined })} />
              : <Typography variant="body2" fontFamily="monospace">{v.targetDate || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>변경 사유</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" multiline minRows={2} value={v.reason || ''} onChange={e => setV({ reason: e.target.value })} />
              : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{v.reason || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>변경 범위</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" multiline minRows={2} value={v.scope || ''} onChange={e => setV({ scope: e.target.value })} />
              : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{v.scope || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>위험성 평가 기법</FormLabel>
          <FormCell borderRight>
            {isEdit ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={v.riskMethod || ''} onChange={e => setV({ riskMethod: (e.target.value || null) as PsmMoc['riskMethod'] })}>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  <MenuItem value="HAZOP">HAZOP</MenuItem>
                  <MenuItem value="WHATIF">What-if</MenuItem>
                  <MenuItem value="CHECKLIST">체크리스트</MenuItem>
                </Select>
              </FormControl>
            ) : <Typography variant="body2">{v.riskMethod || ''}</Typography>}
          </FormCell>
          <FormLabel>평가 결과</FormLabel>
          <FormCell>
            {isEdit ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={v.riskResult || ''} onChange={e => setV({ riskResult: (e.target.value || null) as PsmMoc['riskResult'] })}>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  <MenuItem value="APPROVED">승인</MenuItem>
                  <MenuItem value="CONDITIONAL">조건부 승인</MenuItem>
                  <MenuItem value="REJECTED">반려</MenuItem>
                </Select>
              </FormControl>
            ) : <Typography variant="body2">{v.riskResult || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>위험성 평가일</FormLabel>
          <FormCell borderRight>
            {isEdit ? <DatePickerField value={v.riskReviewDate || null} onChange={d => setV({ riskReviewDate: d || undefined })} />
              : <Typography variant="body2" fontFamily="monospace">{v.riskReviewDate || ''}</Typography>}
          </FormCell>
          <FormLabel>상태</FormLabel>
          <FormCell>
            {isEdit ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={v.status || 'DRAFT'} onChange={e => setV({ status: e.target.value as MocStatus })}>
                  {STATUS.map(s => <MenuItem key={s.code} value={s.code}>{s.label}</MenuItem>)}
                </Select>
              </FormControl>
            ) : <Chip size="small" label={sl(v.status)} color={sc(v.status)} />}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>위험성 검토 의견</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" multiline minRows={2} value={v.riskOpinion || ''} onChange={e => setV({ riskOpinion: e.target.value })} />
              : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{v.riskOpinion || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>계획 승인자</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" value={v.planApproverName || ''} onChange={e => setV({ planApproverName: e.target.value })} />
              : <Typography variant="body2">{v.planApproverName || ''}</Typography>}
          </FormCell>
          <FormLabel>완료 승인자</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.completionApproverName || ''} onChange={e => setV({ completionApproverName: e.target.value })} />
              : <Typography variant="body2">{v.completionApproverName || ''}</Typography>}
          </FormCell>
        </FormRow>
        {!isEdit && v.rejectReason && (
          <FormRow last>
            <FormLabel>반려 사유</FormLabel>
            <FormCell><Typography variant="body2" color="error" sx={{ whiteSpace: 'pre-wrap' }}>{v.rejectReason}</Typography></FormCell>
          </FormRow>
        )}
        {isEdit && (
          <FormRow last>
            <FormLabel>반려 사유</FormLabel>
            <FormCell>
              <TextField fullWidth size="small" multiline minRows={2} value={v.rejectReason || ''} onChange={e => setV({ rejectReason: e.target.value })} placeholder="반려 시 사유 입력" />
            </FormCell>
          </FormRow>
        )}
      </FormTable>

      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list', '목록')}</Button>
        {viewMode === 'create' && <DevTestFillButton onFill={fillTestData} />}
        {isEdit ? (
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

export default PsmMocTab
