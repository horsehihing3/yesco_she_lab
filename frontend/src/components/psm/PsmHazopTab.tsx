import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Button, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, CircularProgress, Alert, TextField, MenuItem, Select, FormControl, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DatePickerField from '../common/DatePickerField'
import LoadingOverlay from '../common/LoadingOverlay'
import { psmApi } from '../../api/psmApi'
import DevTestFillButton from '../common/DevTestFillButton'
import type { PsmHazop, PsmHazopItem } from '../../types/psm.types'
import { useAlert } from '../../contexts/AlertContext'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const HAZOP_STATUS: Record<string, { l: string; c: 'default'|'info'|'success' }> = {
  IN_PROGRESS: { l: '진행 중', c: 'info' },
  REVIEWING:   { l: '검토 중', c: 'info' },
  COMPLETED:   { l: '완료',    c: 'success' },
}
const RG_COLOR: Record<string, 'success'|'warning'|'error'|'default'> = { '저': 'success', '중': 'warning', '고': 'error' }

const emptyHazop = (): Partial<PsmHazop> => ({ status: 'IN_PROGRESS', items: [] })
const emptyItem = (no: number): PsmHazopItem => ({
  itemNo: no, deviation: '', guideWord: 'More', cause: '', consequence: '',
  likelihood: '낮음', severity: '낮음', riskGrade: '저', safeguard: '', owner: '',
  sortOrder: no * 10,
})

const PsmHazopTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<PsmHazop>>(emptyHazop())

  const { data, isLoading } = useQuery({
    queryKey: ['psm-hazop'],
    queryFn: () => psmApi.listHazop(0, 50),
    enabled: viewMode === 'list',
  })
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['psm-hazop-detail', selectedId],
    queryFn: () => psmApi.getHazop(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const createMut = useMutation({
    mutationFn: (h: Partial<PsmHazop>) => psmApi.createHazop(h),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-hazop'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.saved')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, h }: { id: number; h: Partial<PsmHazop> }) => psmApi.updateHazop(id, h),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-hazop'] }); qc.invalidateQueries({ queryKey: ['psm-hazop-detail'] }); showSuccess(t('common.saved')); handleBackToList() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => psmApi.deleteHazop(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-hazop'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.deleted')); handleBackToList() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBackToList = () => { setViewMode('list'); setSelectedId(null); setForm(emptyHazop()) }
  const handleRowClick = (h: PsmHazop) => { setSelectedId(h.id); setViewMode('detail') }
  const handleAddClick = () => { setSelectedId(null); setForm({ ...emptyHazop(), items: [emptyItem(1)] }); setViewMode('create') }
  const handleEditClick = () => { if (detail) { setForm({ ...detail, items: [...(detail.items || [])] }); setViewMode('edit') } }
  const handleSave = async () => {
    if (!form.nodeName?.trim()) { showError(t('psmHazopTab.msg1', '노드명을 입력해 주세요.')); return }
    const ok = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!ok) return
    if (selectedId) updateMut.mutate({ id: selectedId, h: form })
    else createMut.mutate(form)
  }
  const handleDelete = async () => {
    if (!selectedId) return
    const ok = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
    if (ok) deleteMut.mutate(selectedId)
  }

  const setV = (patch: Partial<PsmHazop>) => setForm(f => ({ ...f, ...patch }))
  const fillTestData = () => setForm(prev => ({
    ...prev,
    nodeName: prev.nodeName || '반응기 R-101 공급라인',
    pidDrawingNo: prev.pidDrawingNo || 'PID-RX-101-02',
    designIntent: prev.designIntent || '원료를 정량으로 반응기에 일정 유량 공급',
    reviewDate: prev.reviewDate || '2026-06-11',
    teamLeader: prev.teamLeader || '오리더',
    secretary: prev.secretary || '서서기',
  }))
  const addItem = () => setForm(f => {
    const items = [...(f.items || [])]
    items.push(emptyItem(items.length + 1))
    return { ...f, items }
  })
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: (f.items || []).filter((_, i) => i !== idx) }))
  const updateItem = (idx: number, patch: Partial<PsmHazopItem>) => setForm(f => {
    const items = [...(f.items || [])]
    items[idx] = { ...items[idx], ...patch }
    return { ...f, items }
  })

  // ─── LIST ───
  if (viewMode === 'list') {
    const items = data?.content || []
    return (
      <Box>
        <Box sx={{ display: 'flex', mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold">HAZOP 워크시트</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>{t('common.new', '신규 등록')}</Button>
        </Box>
        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          : items.length === 0 ? <Alert severity="info">{t('common.noData')}</Alert>
          : (
            <Paper variant="outlined">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>HAZOP 번호</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>노드</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>P&amp;ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">검토일</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">팀 리더</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map(h => (
                      <TableRow key={h.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(h)}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{h.hazopNo}</TableCell>
                        <TableCell>{h.nodeName || '-'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{h.pidDrawingNo || '-'}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{h.reviewDate || '-'}</TableCell>
                        <TableCell align="center">{h.teamLeader || '-'}</TableCell>
                        <TableCell align="center">
                          <Chip size="small" label={HAZOP_STATUS[h.status]?.l || h.status} color={HAZOP_STATUS[h.status]?.c || 'default'} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
      </Box>
    )
  }

  // ─── DETAIL / EDIT / CREATE ───
  if (viewMode === 'detail' && (detailLoading || !detail)) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }
  const isEdit = viewMode === 'edit' || viewMode === 'create'
  const v = (isEdit ? form : detail || {}) as Partial<PsmHazop>
  const items = v.items || []

  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        HAZOP {viewMode === 'create' ? '신규 등록' : viewMode === 'edit' ? '수정' : '상세'}
      </Typography>

      <FormTable>
        <FormRow>
          <FormLabel>HAZOP 번호</FormLabel>
          <FormCell borderRight>
            <Typography variant="body2" fontFamily="monospace">{v.hazopNo || (viewMode === 'create' ? '자동 생성' : '')}</Typography>
          </FormCell>
          <FormLabel>P&amp;ID 도면번호</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.pidDrawingNo || ''} onChange={e => setV({ pidDrawingNo: e.target.value })} />
              : <Typography variant="body2" fontFamily="monospace">{v.pidDrawingNo || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel required>노드(Node)</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.nodeName || ''} onChange={e => setV({ nodeName: e.target.value })} />
              : <Typography variant="body2" fontWeight={600}>{v.nodeName || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>설계 의도</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.designIntent || ''} onChange={e => setV({ designIntent: e.target.value })} />
              : <Typography variant="body2">{v.designIntent || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>검토일</FormLabel>
          <FormCell borderRight>
            {isEdit ? <DatePickerField value={v.reviewDate || null} onChange={d => setV({ reviewDate: d || undefined })} />
              : <Typography variant="body2" fontFamily="monospace">{v.reviewDate || ''}</Typography>}
          </FormCell>
          <FormLabel>상태</FormLabel>
          <FormCell>
            {isEdit ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={v.status || 'IN_PROGRESS'} onChange={e => setV({ status: e.target.value as PsmHazop['status'] })}>
                  <MenuItem value="IN_PROGRESS">진행 중</MenuItem>
                  <MenuItem value="REVIEWING">검토 중</MenuItem>
                  <MenuItem value="COMPLETED">완료</MenuItem>
                </Select>
              </FormControl>
            ) : <Chip size="small" label={HAZOP_STATUS[v.status || '']?.l || v.status} color={HAZOP_STATUS[v.status || '']?.c || 'default'} />}
          </FormCell>
        </FormRow>
        <FormRow last>
          <FormLabel>팀 리더</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" value={v.teamLeader || ''} onChange={e => setV({ teamLeader: e.target.value })} />
              : <Typography variant="body2">{v.teamLeader || ''}</Typography>}
          </FormCell>
          <FormLabel>서기</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.secretary || ''} onChange={e => setV({ secretary: e.target.value })} />
              : <Typography variant="body2">{v.secretary || ''}</Typography>}
          </FormCell>
        </FormRow>
      </FormTable>

      {/* ─── HAZOP 워크시트 ─── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight="bold">HAZOP 워크시트</Typography>
        {isEdit && <Button size="small" startIcon={<AddIcon />} onClick={addItem}>행 추가</Button>}
      </Box>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: 'divider' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', width: 40 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>이탈(Deviation)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 100 }}>가이드워드</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>원인</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>결과</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">L</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">S</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 70 }} align="center">위험도</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>안전장치/권고</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 90 }} align="center">담당</TableCell>
                {isEdit && <TableCell sx={{ width: 40 }}></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 && (
                <TableRow><TableCell colSpan={isEdit ? 11 : 10} align="center" sx={{ py: 3, color: 'text.disabled' }}>등록된 행이 없습니다</TableCell></TableRow>
              )}
              {items.map((it, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{it.itemNo || idx + 1}</TableCell>
                  <TableCell>{isEdit ? <TextField size="small" fullWidth value={it.deviation || ''} onChange={e => updateItem(idx, { deviation: e.target.value })} /> : it.deviation}</TableCell>
                  <TableCell>
                    {isEdit ? (
                      <Select size="small" fullWidth value={it.guideWord || 'More'} onChange={e => updateItem(idx, { guideWord: e.target.value as PsmHazopItem['guideWord'] })}>
                        <MenuItem value="More">More</MenuItem><MenuItem value="Less">Less</MenuItem>
                        <MenuItem value="No">No</MenuItem><MenuItem value="Reverse">Reverse</MenuItem><MenuItem value="Other">Other</MenuItem>
                      </Select>
                    ) : it.guideWord}
                  </TableCell>
                  <TableCell>{isEdit ? <TextField size="small" fullWidth value={it.cause || ''} onChange={e => updateItem(idx, { cause: e.target.value })} /> : it.cause}</TableCell>
                  <TableCell>{isEdit ? <TextField size="small" fullWidth value={it.consequence || ''} onChange={e => updateItem(idx, { consequence: e.target.value })} /> : it.consequence}</TableCell>
                  <TableCell align="center">
                    {isEdit ? (
                      <Select size="small" fullWidth value={it.likelihood || '낮음'} onChange={e => updateItem(idx, { likelihood: e.target.value as PsmHazopItem['likelihood'] })}>
                        <MenuItem value="낮음">낮음</MenuItem><MenuItem value="중간">중간</MenuItem><MenuItem value="높음">높음</MenuItem>
                      </Select>
                    ) : it.likelihood}
                  </TableCell>
                  <TableCell align="center">
                    {isEdit ? (
                      <Select size="small" fullWidth value={it.severity || '낮음'} onChange={e => updateItem(idx, { severity: e.target.value as PsmHazopItem['severity'] })}>
                        <MenuItem value="낮음">낮음</MenuItem><MenuItem value="중간">중간</MenuItem><MenuItem value="높음">높음</MenuItem>
                      </Select>
                    ) : it.severity}
                  </TableCell>
                  <TableCell align="center">{it.riskGrade ? <Chip size="small" label={it.riskGrade} color={RG_COLOR[it.riskGrade] || 'default'} /> : ''}</TableCell>
                  <TableCell>{isEdit ? <TextField size="small" fullWidth value={it.safeguard || ''} onChange={e => updateItem(idx, { safeguard: e.target.value })} /> : it.safeguard}</TableCell>
                  <TableCell>{isEdit ? <TextField size="small" fullWidth value={it.owner || ''} onChange={e => updateItem(idx, { owner: e.target.value })} /> : it.owner}</TableCell>
                  {isEdit && <TableCell><IconButton size="small" color="error" onClick={() => removeItem(idx)}><DeleteIcon fontSize="inherit" /></IconButton></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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

export default PsmHazopTab
