import { useState, useMemo } from 'react'
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
import NumberField from '../common/NumberField'
import LoadingOverlay from '../common/LoadingOverlay'
import { psmApi } from '../../api/psmApi'
import DevTestFillButton from '../common/DevTestFillButton'
import type { PsmWo, PsmWoOperation, PsmWoMaterial, WoStatus } from '../../types/psm.types'
import { useAlert } from '../../contexts/AlertContext'

type ViewMode = 'list' | 'detail' | 'create' | 'edit'

const WO_STATUS: Record<WoStatus, { l: string; c: 'default' | 'info' | 'success' | 'warning' }> = {
  CREATED:     { l: '생성',     c: 'default' },
  PLANNED:     { l: '계획수립', c: 'info' },
  APPROVED:    { l: '승인',     c: 'info' },
  IN_PROGRESS: { l: '진행 중',  c: 'warning' },
  COMPLETED:   { l: '완료',     c: 'success' },
}
const WO_TYPE = [
  { v: 'PM01', l: 'PM01 — 예방정비' },
  { v: 'PM02', l: 'PM02 — 수리정비' },
  { v: 'PM03', l: 'PM03 — 검사' },
]
const PRIORITY = [
  { v: '1', l: '1 — 매우긴급' },
  { v: '2', l: '2 — 긴급' },
  { v: '3', l: '3 — 보통' },
]
const OP_STATUS: Record<string, { l: string; c: 'default' | 'info' | 'success' | 'warning' }> = {
  PENDING:     { l: '대기',    c: 'default' },
  IN_PROGRESS: { l: '진행 중', c: 'info' },
  DONE:        { l: '완료',    c: 'success' },
}
const MAT_STATUS: Record<string, { l: string; c: 'default' | 'success' | 'warning' | 'error' }> = {
  STOCK:      { l: '재고 있음', c: 'success' },
  PURCHASING: { l: '조달 중',   c: 'warning' },
  SHORT:      { l: '부족',      c: 'error' },
}

const parseJson = <T,>(s?: string | null): T[] => { try { return s ? JSON.parse(s) : [] } catch { return [] } }
const emptyWo = (): Partial<PsmWo> => ({ status: 'CREATED', operationsJson: '[]', materialsJson: '[]' })

const PsmWorkOrderTab: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<PsmWo>>(emptyWo())

  const { data, isLoading } = useQuery({
    queryKey: ['psm-wo'],
    queryFn: () => psmApi.listWo(0, 50),
    enabled: viewMode === 'list',
  })
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['psm-wo-detail', selectedId],
    queryFn: () => psmApi.getWo(selectedId!),
    enabled: !!selectedId && (viewMode === 'detail' || viewMode === 'edit'),
  })

  const createMut = useMutation({
    mutationFn: (w: Partial<PsmWo>) => psmApi.createWo(w),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-wo'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.saved')); handleBackToList() },
    onError: () => showError(t('common.error')),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, w }: { id: number; w: Partial<PsmWo> }) => psmApi.updateWo(id, w),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-wo'] }); qc.invalidateQueries({ queryKey: ['psm-wo-detail'] }); showSuccess(t('common.saved')); handleBackToList() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => psmApi.deleteWo(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['psm-wo'] }); qc.invalidateQueries({ queryKey: ['psm-dashboard'] }); showSuccess(t('common.deleted')); handleBackToList() },
  })
  const isProcessing = createMut.isPending || updateMut.isPending || deleteMut.isPending

  const handleBackToList = () => { setViewMode('list'); setSelectedId(null); setForm(emptyWo()) }
  const handleRowClick = (w: PsmWo) => { setSelectedId(w.id); setViewMode('detail') }
  const handleAddClick = () => { setSelectedId(null); setForm(emptyWo()); setViewMode('create') }
  const handleEditClick = () => { if (detail) { setForm({ ...detail }); setViewMode('edit') } }
  const handleSave = async () => {
    if (!form.equipmentName?.trim()) { showError(t('psmWorkOrderTab.msg1', '설비명을 입력해 주세요.')); return }
    if (!form.description?.trim()) { showError(t('psmWorkOrderTab.msg2', '작업 내용을 입력해 주세요.')); return }
    const ok = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!ok) return
    if (selectedId) updateMut.mutate({ id: selectedId, w: form })
    else createMut.mutate(form)
  }
  const handleDelete = async () => {
    if (!selectedId) return
    const ok = await showConfirm(t('common.confirmDelete', '삭제하시겠습니까?'))
    if (ok) deleteMut.mutate(selectedId)
  }

  const setV = (patch: Partial<PsmWo>) => setForm(f => ({ ...f, ...patch }))
  const fillTestData = () => setForm(prev => ({
    ...prev,
    woType: prev.woType || 'PM01',
    priority: prev.priority || '2',
    equipmentNo: prev.equipmentNo || 'EQ-P-301',
    equipmentName: prev.equipmentName || '이송펌프 P-301',
    functionalLocation: prev.functionalLocation || 'PL1-RX-P301',
    workCenter: prev.workCenter || '기계정비반',
    planStartDate: prev.planStartDate || '2026-06-15',
    planEndDate: prev.planEndDate || '2026-06-16',
    managerName: prev.managerName || '정정비',
    plantCode: prev.plantCode || 'PL1',
    description: prev.description || '이송펌프 P-301 메커니컬 실 교체 및 베어링 점검',
    laborCost: prev.laborCost ?? 300000,
    materialCost: prev.materialCost ?? 450000,
    outsourcingCost: prev.outsourcingCost ?? 0,
    otherCost: prev.otherCost ?? 50000,
  }))

  const operations = useMemo<PsmWoOperation[]>(() => parseJson(form.operationsJson), [form.operationsJson])
  const materials  = useMemo<PsmWoMaterial[]>(() => parseJson(form.materialsJson), [form.materialsJson])

  const updateOps = (next: PsmWoOperation[]) => setV({ operationsJson: JSON.stringify(next) })
  const updateMats = (next: PsmWoMaterial[]) => setV({ materialsJson: JSON.stringify(next) })

  // ─── LIST ───
  if (viewMode === 'list') {
    const items = data?.content || []
    return (
      <Box>
        {/* PC toolbar */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold">Work Order</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick}>{t('common.new', '신규 등록')}</Button>
        </Box>
        {/* Mobile toolbar */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">Work Order</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ flex: 1 }}>{t('common.new', '신규 등록')}</Button>
          </Box>
        </Box>
        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          : items.length === 0 ? <Alert severity="info">{t('common.noData')}</Alert>
          : (
            <>
              {/* PC Table */}
              <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>WO 번호</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">유형</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">우선순위</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>설비</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>작업내용</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">계획기간</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">담당자</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">상태</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map(w => (
                        <TableRow key={w.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(w)}>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{w.woNo}</TableCell>
                          <TableCell align="center">{w.woType || '-'}</TableCell>
                          <TableCell align="center">{w.priority || '-'}</TableCell>
                          <TableCell>{w.equipmentName || '-'}</TableCell>
                          <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.description || '-'}</TableCell>
                          <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {w.planStartDate || '-'} ~ {w.planEndDate || '-'}
                          </TableCell>
                          <TableCell align="center">{w.managerName || '-'}</TableCell>
                          <TableCell align="center"><Chip size="small" label={WO_STATUS[w.status]?.l || w.status} color={WO_STATUS[w.status]?.c || 'default'} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
              {/* Mobile Card List */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {items.map(w => (
                  <Paper key={w.id} variant="outlined" sx={{ p: 1.5, mb: 1, cursor: 'pointer' }} onClick={() => handleRowClick(w)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ wordBreak: 'break-all' }}>
                          <span style={{ fontFamily: 'monospace' }}>{w.woNo}</span> · {w.equipmentName || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {w.woType || '-'} / 우선순위: {w.priority || '-'} · 담당: {w.managerName || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {w.description || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {w.planStartDate || '-'} ~ {w.planEndDate || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ flexShrink: 0 }}>
                        <Chip size="small" label={WO_STATUS[w.status]?.l || w.status} color={WO_STATUS[w.status]?.c || 'default'} />
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </>
          )}
      </Box>
    )
  }

  // ─── DETAIL / EDIT / CREATE ───
  if (viewMode === 'detail' && (detailLoading || !detail)) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }
  const isEdit = viewMode === 'edit' || viewMode === 'create'
  const v = (isEdit ? form : detail || {}) as Partial<PsmWo>
  const totalCost = (Number(v.laborCost) || 0) + (Number(v.materialCost) || 0) + (Number(v.outsourcingCost) || 0) + (Number(v.otherCost) || 0)

  return (
    <Box>
      <LoadingOverlay open={isProcessing} />
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        Work Order
      </Typography>

      <FormTable>
        <FormRow>
          <FormLabel>WO 번호</FormLabel>
          <FormCell borderRight><Typography variant="body2" fontFamily="monospace">{v.woNo || (viewMode === 'create' ? '자동 생성' : '')}</Typography></FormCell>
          <FormLabel>상태</FormLabel>
          <FormCell>
            {isEdit ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={v.status || 'CREATED'} onChange={e => setV({ status: e.target.value as WoStatus })}>
                  {(Object.keys(WO_STATUS) as WoStatus[]).map(k => <MenuItem key={k} value={k}>{WO_STATUS[k].l}</MenuItem>)}
                </Select>
              </FormControl>
            ) : <Chip size="small" label={WO_STATUS[v.status as WoStatus]?.l || v.status} color={WO_STATUS[v.status as WoStatus]?.c || 'default'} />}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>작업지시 유형</FormLabel>
          <FormCell borderRight>
            {isEdit ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={v.woType || ''} onChange={e => setV({ woType: e.target.value })}>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {WO_TYPE.map(o => <MenuItem key={o.v} value={o.v}>{o.l}</MenuItem>)}
                </Select>
              </FormControl>
            ) : <Typography variant="body2">{WO_TYPE.find(t => t.v === v.woType)?.l || v.woType || ''}</Typography>}
          </FormCell>
          <FormLabel>우선순위</FormLabel>
          <FormCell>
            {isEdit ? (
              <FormControl fullWidth size="small">
                <Select displayEmpty value={v.priority || ''} onChange={e => setV({ priority: e.target.value })}>
                  <MenuItem value="" disabled>선택하세요</MenuItem>
                  {PRIORITY.map(o => <MenuItem key={o.v} value={o.v}>{o.l}</MenuItem>)}
                </Select>
              </FormControl>
            ) : <Typography variant="body2">{PRIORITY.find(p => p.v === v.priority)?.l || v.priority || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>설비번호</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" value={v.equipmentNo || ''} onChange={e => setV({ equipmentNo: e.target.value })} />
              : <Typography variant="body2" fontFamily="monospace">{v.equipmentNo || ''}</Typography>}
          </FormCell>
          <FormLabel required>설비명</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.equipmentName || ''} onChange={e => setV({ equipmentName: e.target.value })} />
              : <Typography variant="body2" fontWeight={600}>{v.equipmentName || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>기능위치(FL)</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" value={v.functionalLocation || ''} onChange={e => setV({ functionalLocation: e.target.value })} />
              : <Typography variant="body2" fontFamily="monospace">{v.functionalLocation || ''}</Typography>}
          </FormCell>
          <FormLabel>작업장</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.workCenter || ''} onChange={e => setV({ workCenter: e.target.value })} />
              : <Typography variant="body2">{v.workCenter || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>계획 시작일</FormLabel>
          <FormCell borderRight>
            {isEdit ? <DatePickerField value={v.planStartDate || null} onChange={d => setV({ planStartDate: d || undefined })} />
              : <Typography variant="body2" fontFamily="monospace">{v.planStartDate || ''}</Typography>}
          </FormCell>
          <FormLabel>계획 완료일</FormLabel>
          <FormCell>
            {isEdit ? <DatePickerField value={v.planEndDate || null} onChange={d => setV({ planEndDate: d || undefined })} />
              : <Typography variant="body2" fontFamily="monospace">{v.planEndDate || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>담당자</FormLabel>
          <FormCell borderRight>
            {isEdit ? <TextField fullWidth size="small" value={v.managerName || ''} onChange={e => setV({ managerName: e.target.value })} />
              : <Typography variant="body2">{v.managerName || ''}</Typography>}
          </FormCell>
          <FormLabel>플랜트</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" value={v.plantCode || ''} onChange={e => setV({ plantCode: e.target.value })} />
              : <Typography variant="body2">{v.plantCode || ''}</Typography>}
          </FormCell>
        </FormRow>
        <FormRow last>
          <FormLabel required>작업 내용</FormLabel>
          <FormCell>
            {isEdit ? <TextField fullWidth size="small" multiline minRows={3} value={v.description || ''} onChange={e => setV({ description: e.target.value })} />
              : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{v.description || ''}</Typography>}
          </FormCell>
        </FormRow>
      </FormTable>

      {/* Operations */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight="bold">Operations (작업 단계)</Typography>
        {isEdit && <Button size="small" startIcon={<AddIcon />} onClick={() => updateOps([...operations, { no: String((operations.length + 1) * 10).padStart(4, '0'), desc: '', wc: '', hours: 0, crew: 1, status: 'PENDING' }])}>행 추가</Button>}
      </Box>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', width: 80 }}>No.</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>작업 내용</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>작업장</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 90 }} align="center">공수(H)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">인원</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">상태</TableCell>
                {isEdit && <TableCell sx={{ width: 40 }}></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {operations.length === 0 && (
                <TableRow><TableCell colSpan={isEdit ? 7 : 6} align="center" sx={{ py: 3, color: 'text.disabled' }}>등록된 작업이 없습니다</TableCell></TableRow>
              )}
              {operations.map((op, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{isEdit ? <TextField size="small" fullWidth value={op.no} onChange={e => { const n = [...operations]; n[idx] = { ...op, no: e.target.value }; updateOps(n) }} /> : op.no}</TableCell>
                  <TableCell>{isEdit ? <TextField size="small" fullWidth value={op.desc} onChange={e => { const n = [...operations]; n[idx] = { ...op, desc: e.target.value }; updateOps(n) }} /> : op.desc}</TableCell>
                  <TableCell>{isEdit ? <TextField size="small" fullWidth value={op.wc || ''} onChange={e => { const n = [...operations]; n[idx] = { ...op, wc: e.target.value }; updateOps(n) }} /> : op.wc}</TableCell>
                  <TableCell align="center">{isEdit ? <NumberField fullWidth value={op.hours ?? null} onChange={vv => { const n = [...operations]; n[idx] = { ...op, hours: vv ?? 0 }; updateOps(n) }} thousandSeparator={false} /> : op.hours}</TableCell>
                  <TableCell align="center">{isEdit ? <NumberField fullWidth value={op.crew ?? null} onChange={vv => { const n = [...operations]; n[idx] = { ...op, crew: vv ?? 0 }; updateOps(n) }} thousandSeparator={false} /> : op.crew}</TableCell>
                  <TableCell align="center">
                    {isEdit ? (
                      <Select size="small" fullWidth value={op.status || 'PENDING'} onChange={e => { const n = [...operations]; n[idx] = { ...op, status: e.target.value as PsmWoOperation['status'] }; updateOps(n) }}>
                        {Object.keys(OP_STATUS).map(k => <MenuItem key={k} value={k}>{OP_STATUS[k].l}</MenuItem>)}
                      </Select>
                    ) : <Chip size="small" label={OP_STATUS[op.status || 'PENDING']?.l} color={OP_STATUS[op.status || 'PENDING']?.c} />}
                  </TableCell>
                  {isEdit && <TableCell><IconButton size="small" color="error" onClick={() => updateOps(operations.filter((_, i) => i !== idx))}><DeleteIcon fontSize="inherit" /></IconButton></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Components / Materials */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight="bold">Components (자재)</Typography>
        {isEdit && <Button size="small" startIcon={<AddIcon />} onClick={() => updateMats([...materials, { code: '', name: '', qty: 1, unit: 'EA', status: 'STOCK' }])}>행 추가</Button>}
      </Box>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>자재 코드</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>자재명</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">수량</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">단위</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 110 }} align="center">상태</TableCell>
                {isEdit && <TableCell sx={{ width: 40 }}></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.length === 0 && (
                <TableRow><TableCell colSpan={isEdit ? 6 : 5} align="center" sx={{ py: 3, color: 'text.disabled' }}>등록된 자재가 없습니다</TableCell></TableRow>
              )}
              {materials.map((mt, idx) => (
                <TableRow key={idx}>
                  <TableCell>{isEdit ? <TextField size="small" fullWidth value={mt.code} onChange={e => { const n = [...materials]; n[idx] = { ...mt, code: e.target.value }; updateMats(n) }} /> : mt.code}</TableCell>
                  <TableCell>{isEdit ? <TextField size="small" fullWidth value={mt.name} onChange={e => { const n = [...materials]; n[idx] = { ...mt, name: e.target.value }; updateMats(n) }} /> : mt.name}</TableCell>
                  <TableCell align="center">{isEdit ? <NumberField fullWidth value={mt.qty ?? null} onChange={vv => { const n = [...materials]; n[idx] = { ...mt, qty: vv ?? 0 }; updateMats(n) }} thousandSeparator={false} /> : mt.qty}</TableCell>
                  <TableCell align="center">{isEdit ? <TextField size="small" fullWidth value={mt.unit || ''} onChange={e => { const n = [...materials]; n[idx] = { ...mt, unit: e.target.value }; updateMats(n) }} /> : mt.unit}</TableCell>
                  <TableCell align="center">
                    {isEdit ? (
                      <Select size="small" fullWidth value={mt.status || 'STOCK'} onChange={e => { const n = [...materials]; n[idx] = { ...mt, status: e.target.value as PsmWoMaterial['status'] }; updateMats(n) }}>
                        {Object.keys(MAT_STATUS).map(k => <MenuItem key={k} value={k}>{MAT_STATUS[k].l}</MenuItem>)}
                      </Select>
                    ) : <Chip size="small" label={MAT_STATUS[mt.status || 'STOCK']?.l} color={MAT_STATUS[mt.status || 'STOCK']?.c} />}
                  </TableCell>
                  {isEdit && <TableCell><IconButton size="small" color="error" onClick={() => updateMats(materials.filter((_, i) => i !== idx))}><DeleteIcon fontSize="inherit" /></IconButton></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Costs */}
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 3, mb: 1.5 }}>Costs (비용)</Typography>
      <FormTable>
        <FormRow>
          <FormLabel>인건비</FormLabel>
          <FormCell borderRight>
            {isEdit ? <NumberField fullWidth value={v.laborCost ?? null} onChange={vv => setV({ laborCost: vv ?? undefined })} /> : <Typography variant="body2">{(v.laborCost || 0).toLocaleString()} 원</Typography>}
          </FormCell>
          <FormLabel>자재비</FormLabel>
          <FormCell>
            {isEdit ? <NumberField fullWidth value={v.materialCost ?? null} onChange={vv => setV({ materialCost: vv ?? undefined })} /> : <Typography variant="body2">{(v.materialCost || 0).toLocaleString()} 원</Typography>}
          </FormCell>
        </FormRow>
        <FormRow>
          <FormLabel>외주비</FormLabel>
          <FormCell borderRight>
            {isEdit ? <NumberField fullWidth value={v.outsourcingCost ?? null} onChange={vv => setV({ outsourcingCost: vv ?? undefined })} /> : <Typography variant="body2">{(v.outsourcingCost || 0).toLocaleString()} 원</Typography>}
          </FormCell>
          <FormLabel>기타</FormLabel>
          <FormCell>
            {isEdit ? <NumberField fullWidth value={v.otherCost ?? null} onChange={vv => setV({ otherCost: vv ?? undefined })} /> : <Typography variant="body2">{(v.otherCost || 0).toLocaleString()} 원</Typography>}
          </FormCell>
        </FormRow>
        <FormRow last>
          <FormLabel>합계</FormLabel>
          <FormCell><Typography variant="body2" fontWeight={700} color="primary.main">{totalCost.toLocaleString()} 원</Typography></FormCell>
        </FormRow>
      </FormTable>

      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>
          {isEdit ? t('common.cancel', '취소') : t('common.list', '목록')}
        </Button>
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

export default PsmWorkOrderTab
