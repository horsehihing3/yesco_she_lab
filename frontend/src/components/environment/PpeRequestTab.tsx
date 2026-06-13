import { formatDateTime } from '../../utils/dateDefaults'
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Select, MenuItem,
  FormControl, Chip, Pagination, CircularProgress, Alert, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import NumberField from '../common/NumberField'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { ppeRequestApi, ppeEquipmentApi } from '../../api/ppeEquipmentApi'
import { PpeRequestItem, PpeRequestCreate } from '../../types/ppeEquipment.types'
import useCodeMap from '../../hooks/useCodeMap'
import { useButtonRules } from '../../hooks/useButtonRules'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse } from '../../types/common.types'

// 회사 트리에서 username → dept 이름 매핑을 추출 — 부서코드(예: '00041') 가 아닌 부서명을 표시하기 위함.
interface CompanyTreeNode {
  type: string
  label?: string
  username?: string
  department?: string
  children?: CompanyTreeNode[]
}
const fetchCompanyTree = async (): Promise<CompanyTreeNode[]> => {
  const res = await axiosInstance.get<ApiResponse<CompanyTreeNode[]>>('/users/company-tree')
  return res.data.data || []
}

type ViewMode = 'list' | 'detail' | 'create'

const STATUS_COLORS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  REQUESTED: 'info', APPROVED: 'success', ISSUED: 'success', RETURNED: 'default', REJECTED: 'error', CANCELLED: 'default',
}

const labelSx = { width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all' as const }
const valSx = { flex: 1, px: 2, py: 1.5, bgcolor: 'background.paper' }
const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'divider' }
const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'divider' }
const hSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const PpeRequestTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showError, showConfirm } = useAlert()
  const { user } = useAuth()
  const { codeList: statusCodes, getLabel: getStatusLabel } = useCodeMap('PPE_REQUEST_STATUS')
  const { codeList: categoryCodes, getLabel: getCategoryLabel } = useCodeMap('PPE_CATEGORY')

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItem, setSelectedItem] = useState<PpeRequestItem | null>(null)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState<PpeRequestCreate>({ itemName: '', quantity: 1 })
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data: equipmentData } = useQuery({
    queryKey: ['ppeEquipmentAll'],
    queryFn: () => ppeEquipmentApi.getAll(0, 100),
  })

  // 회사 트리 — username 별 부서명 lookup
  const { data: companyTree = [] } = useQuery({
    queryKey: ['companyTreeFull'],
    queryFn: fetchCompanyTree,
    staleTime: 5 * 60_000,
  })
  const deptByUsername = useMemo(() => {
    const map: Record<string, string> = {}
    const walk = (nodes: CompanyTreeNode[], parentLabels: string[]) => {
      for (const n of nodes) {
        if (n.type === 'DEPARTMENT') {
          walk(n.children || [], [...parentLabels, n.label || ''])
        } else if (n.type === 'COMPANY') {
          walk(n.children || [], [n.label || ''])
        } else if (n.type === 'USER' && n.username) {
          if (n.department) map[n.username] = n.department
          else map[n.username] = parentLabels[parentLabels.length - 1] || ''
        }
      }
    }
    walk(companyTree, [])
    return map
  }, [companyTree])

  // 표시용: '이름 (부서명)' — 부서가 숫자 코드면 트리 매핑으로 교체
  const formatPerson = (name?: string | null, dept?: string | null, username?: string | null): string => {
    const n = name || ''
    let d = dept || ''
    // 부서가 숫자 코드 패턴이면 username 매핑으로 대체
    if (username && deptByUsername[username]) {
      d = deptByUsername[username]
    } else if (d && /^\d+$/.test(d)) {
      d = ''
    }
    return d ? `${n} (${d})` : n
  }

  const queryKey = statusFilter ? ['ppeRequest', statusFilter, page] : ['ppeRequest', page]
  const queryFn = () => statusFilter ? ppeRequestApi.getByStatus(statusFilter, page, 10) : ppeRequestApi.getAll(page, 10)
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled: viewMode === 'list' })

  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ['ppeRequest'] })
  const createMut = useMutation({ mutationFn: (r: PpeRequestCreate) => ppeRequestApi.create(r), onSuccess: () => { invalidateAll(); showSuccess(t('common.saved')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const approveMut = useMutation({ mutationFn: ({ id, name, dept }: { id: number; name: string; dept: string }) => ppeRequestApi.approve(id, name, dept), onSuccess: () => { invalidateAll(); showSuccess(t('ppeReq.approved', '승인되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const rejectMut = useMutation({ mutationFn: ({ id, name, dept, reason }: { id: number; name: string; dept: string; reason?: string }) => ppeRequestApi.reject(id, name, dept, reason), onSuccess: () => { invalidateAll(); showSuccess(t('ppeReq.rejected', '반려되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const issueMut = useMutation({ mutationFn: (id: number) => ppeRequestApi.issue(id), onSuccess: () => { invalidateAll(); showSuccess(t('ppeReq.issued')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const returnMut = useMutation({ mutationFn: (id: number) => ppeRequestApi.returnItem(id), onSuccess: () => { invalidateAll(); showSuccess(t('ppeReq.returned', '반납 처리되었습니다.')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const cancelMut = useMutation({ mutationFn: (id: number) => ppeRequestApi.cancel(id), onSuccess: () => { invalidateAll(); showSuccess(t('ppeReq.cancelled')); handleBackToList() }, onError: () => showError(t('common.error')) })
  const deleteMut = useMutation({ mutationFn: (id: number) => ppeRequestApi.delete(id), onSuccess: () => { invalidateAll(); showSuccess(t('common.deleted')); handleBackToList() }, onError: () => showError(t('common.error')) })

  const { canSee } = useButtonRules()
  const MENU_REQ = '안전 관리 › 보호구 장비 › 지급 신청'
  const getRoles = useMemo(() => (item?: { requesterId?: string | null }): string[] => {
    const roles: string[] = ['guest']
    if (user?.role === 'SYSTEM_ADMIN') roles.push('superAdmin')
    else if (user?.role) roles.push(user.role)
    if (item?.requesterId && user?.username && item.requesterId === user.username) roles.push('writer')
    return roles
  }, [user])

  const handleBackToList = () => { setViewMode('list'); setSelectedItem(null); setForm({ itemName: '', quantity: 1 }); setRejectMode(false); setRejectReason('') }
  const handleApprove = async (item: PpeRequestItem) => {
    const ok = await showConfirm(t('ppeReq.confirmApprove', '승인하시겠습니까?'))
    if (ok) approveMut.mutate({ id: item.id, name: user?.name || '', dept: user?.department || '' })
  }
  const handleReject = (item: PpeRequestItem) => {
    if (!rejectReason.trim()) return
    rejectMut.mutate({ id: item.id, name: user?.name || '', dept: user?.department || '', reason: rejectReason })
  }
  const handleRowClick = (item: PpeRequestItem) => { setSelectedItem(item); setViewMode('detail') }
  const handleOpenCreate = () => { setSelectedItem(null); setForm({ itemName: '', quantity: 1, requesterName: user?.name, requesterDept: user?.department, requesterId: user?.username }); setViewMode('create') }
  const handleOpenEdit = (item: PpeRequestItem) => { setSelectedItem(item); setForm({ equipmentId: item.equipmentId, itemName: item.itemName, itemCategory: item.itemCategory, itemModel: item.itemModel, quantity: item.quantity, reason: item.reason, requesterName: item.requesterName, requesterDept: item.requesterDept, requesterId: item.requesterId, notes: item.notes }); setViewMode('create') }
  const handleSave = () => createMut.mutate(form)
  const handleDelete = async (item: PpeRequestItem) => { const ok = await showConfirm(`${item.itemName}\n${t('common.delete')}하시겠습니까?`); if (ok) deleteMut.mutate(item.id) }

  const handleIssue = async (id: number) => {
    const ok = await showConfirm(t('ppeReq.confirmIssue'))
    if (ok) issueMut.mutate(id)
  }

  const handleReturn = async (id: number) => {
    const ok = await showConfirm(t('ppeReq.confirmReturn', '반납 처리하시겠습니까?'))
    if (ok) returnMut.mutate(id)
  }

  const selectedEquipment = equipmentData?.content?.find(e => e.id === form.equipmentId)
  const maxStock = selectedEquipment?.stockQuantity || 0
  const [quantityWarning, setQuantityWarning] = useState(false)

  const handleEquipmentSelect = (eqId: string) => {
    const eq = equipmentData?.content?.find(e => e.id === Number(eqId))
    if (eq) { setForm({ ...form, equipmentId: eq.id, itemName: eq.name, itemCategory: eq.category, itemModel: eq.model || '', quantity: 1 }); setQuantityWarning(false) }
  }

  const handleQuantityChange = (val: string) => {
    const num = Math.floor(Number(val))
    if (num < 0) return
    if (num > maxStock) { setQuantityWarning(true); setForm({ ...form, quantity: maxStock }) }
    else { setQuantityWarning(false); setForm({ ...form, quantity: num }) }
  }

  const items = data?.content || []
  const totalPages = data?.totalPages || 0
  const dLabelSx = { ...labelSx, width: 140, minWidth: 140 }

  // ==================== DETAIL VIEW ====================
  if (viewMode === 'detail' && selectedItem) {
    return (
      <Box>
        {/* PC 2열 */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          <Box sx={rowSx}><Typography sx={dLabelSx}>{t('ppeReq.requestId')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.requestId}</Typography></Box><Typography sx={dLabelSx}>{t('ppeReq.status')}</Typography><Box sx={valSx}><Chip label={getStatusLabel(selectedItem.status)} color={STATUS_COLORS[selectedItem.status] || 'default'} size="small" /></Box></Box>
          <Box sx={rowSx}><Typography sx={dLabelSx}>{t('ppeReq.itemName')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.itemName}</Typography></Box><Typography sx={dLabelSx}>{t('ppeReq.category')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{getCategoryLabel(selectedItem.itemCategory || '')}</Typography></Box></Box>
          <Box sx={rowSx}><Typography sx={dLabelSx}>{t('ppeReq.model')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.itemModel || ''}</Typography></Box><Typography sx={dLabelSx}>{t('ppeReq.quantity')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.quantity}{selectedItem.isConsumable && <Chip label={t('ppe.consumable', '소모품')} color="warning" size="small" sx={{ ml: 1, fontSize: '0.65rem', height: 18 }} />}</Typography></Box></Box>
          <Box sx={rowSx}><Typography sx={dLabelSx}>{t('ppeReq.requester')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{formatPerson(selectedItem.requesterName, selectedItem.requesterDept, selectedItem.requesterId)}</Typography></Box><Typography sx={dLabelSx}>{t('ppeReq.requestDate')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{formatDateTime(selectedItem.requestDate)}</Typography></Box></Box>
          <Box sx={rowSx}><Typography sx={dLabelSx}>{t('ppeReq.approver')}</Typography><Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{formatPerson(selectedItem.approverName, selectedItem.approverDept)}</Typography></Box><Typography sx={dLabelSx}>{t('ppeReq.approvedAt')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{formatDateTime(selectedItem.approvedAt) || ''}</Typography></Box></Box>
          {selectedItem.issuedAt && <Box sx={rowSx}><Typography sx={dLabelSx}>{t('ppeReq.issuedAt')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{formatDateTime(selectedItem.issuedAt)}</Typography></Box></Box>}
          <Box sx={rowSx}><Typography sx={dLabelSx}>{t('ppeReq.reason')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5, whiteSpace: 'pre-wrap' }}>{selectedItem.reason || ''}</Typography></Box></Box>
          {selectedItem.rejectionReason && <Box sx={rowSx}><Typography sx={dLabelSx}>{t('ppeReq.rejectionReason')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5, color: 'error.main' }}>{selectedItem.rejectionReason}</Typography></Box></Box>}
          {selectedItem.notes && <Box sx={rowSx}><Typography sx={dLabelSx}>{t('common.notes')}</Typography><Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.notes}</Typography></Box></Box>}
          {/* 작성자 | 작성일자 */}
          <Box sx={selectedItem.modifiedAt && selectedItem.modifiedAt !== selectedItem.createdAt ? rowSx : { display: 'flex' }}>
            <Typography sx={dLabelSx}>{t('common.creator', '작성자')}</Typography>
            <Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.requesterName || ''}</Typography></Box>
            <Typography sx={dLabelSx}>{t('audit.createdAt', '작성일자')}</Typography>
            <Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5, fontFamily: 'monospace' }}>{formatDateTime(selectedItem.createdAt) || ''}</Typography></Box>
          </Box>
          {/* 수정자 | 수정일자 — 수정 이력 있을 때만 */}
          {selectedItem.modifiedAt && selectedItem.modifiedAt !== selectedItem.createdAt && (
            <Box sx={{ display: 'flex' }}>
              <Typography sx={dLabelSx}>{t('common.modifier', '수정자')}</Typography>
              <Box sx={valBorderSx}><Typography variant="body2" sx={{ py: 0.5 }}>{selectedItem.requesterName || ''}</Typography></Box>
              <Typography sx={dLabelSx}>{t('common.modifiedAt', '수정일자')}</Typography>
              <Box sx={valSx}><Typography variant="body2" sx={{ py: 0.5, fontFamily: 'monospace' }}>{formatDateTime(selectedItem.modifiedAt)}</Typography></Box>
            </Box>
          )}
        </Box>
        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          {[[t('ppeReq.requestId'), selectedItem.requestId], [t('ppeReq.status'), getStatusLabel(selectedItem.status)], [t('ppeReq.itemName'), selectedItem.itemName], [t('ppeReq.category'), getCategoryLabel(selectedItem.itemCategory || '')], [t('ppeReq.quantity'), `${selectedItem.quantity}`], [t('ppeReq.requester'), formatPerson(selectedItem.requesterName, selectedItem.requesterDept, selectedItem.requesterId)], [t('ppeReq.requestDate'), formatDateTime(selectedItem.requestDate)], [t('ppeReq.approver'), selectedItem.approverName ? formatPerson(selectedItem.approverName, selectedItem.approverDept) : ''], [t('ppeReq.reason'), selectedItem.reason], [t('ppeReq.rejectionReason'), selectedItem.rejectionReason], [t('common.notes'), selectedItem.notes], [t('common.creator', '작성자'), selectedItem.requesterName || ''], [t('audit.createdAt', '작성일자'), formatDateTime(selectedItem.createdAt)], ...(selectedItem.modifiedAt && selectedItem.modifiedAt !== selectedItem.createdAt ? [[t('common.modifier', '수정자'), selectedItem.requesterName || ''], [t('common.modifiedAt', '수정일자'), formatDateTime(selectedItem.modifiedAt)]] : [])].filter(([, v]) => v).map(([label, value], i) => (
            <Box key={i}><Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{label}</Typography><Typography variant="body2" sx={{ px: 1.5, py: 0.5, whiteSpace: 'pre-wrap' }}>{value}</Typography></Box>
          ))}
        </Box>

        {/* 반려 사유 입력 */}
        {rejectMode && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth size="small" multiline rows={2}
              label={t('ppeReq.rejectionReason')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap' }}>
          {canSee(MENU_REQ, 'REQUESTED', '취소', getRoles(selectedItem)) && selectedItem.status === 'REQUESTED' && (
            <Button variant="outlined" color="warning" onClick={() => cancelMut.mutate(selectedItem.id)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('ppeReq.cancel')}</Button>
          )}
          <Button variant="outlined" onClick={handleBackToList} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.list')}</Button>
          {canSee(MENU_REQ, 'APPROVED', '지급완료', getRoles(selectedItem)) && selectedItem.status === 'APPROVED' && (
            <Button variant="contained" color="success" onClick={() => handleIssue(selectedItem.id)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('ppeReq.issueComplete')}</Button>
          )}
          {canSee(MENU_REQ, 'ISSUED', '반납', getRoles(selectedItem)) && selectedItem.status === 'ISSUED' && !selectedItem.isConsumable && (
            <Button variant="contained" color="warning" onClick={() => handleReturn(selectedItem.id)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('ppeReq.return', '반납')}</Button>
          )}
          {canSee(MENU_REQ, 'REQUESTED', '수정', getRoles(selectedItem)) && selectedItem.status === 'REQUESTED' && !rejectMode && (
            <Button variant="contained" onClick={() => handleOpenEdit(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.edit')}</Button>
          )}
          {canSee(MENU_REQ, 'REQUESTED', '삭제', getRoles(selectedItem)) && selectedItem.status === 'REQUESTED' && !rejectMode && (
            <Button variant="contained" color="error" onClick={() => handleDelete(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.delete')}</Button>
          )}
          {canSee(MENU_REQ, 'REQUESTED', '반려', getRoles(selectedItem)) && selectedItem.status === 'REQUESTED' && (
            rejectMode
              ? <>
                  <Button variant="outlined" onClick={() => { setRejectMode(false); setRejectReason('') }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
                  <Button variant="contained" color="error" onClick={() => handleReject(selectedItem)} disabled={!rejectReason.trim()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('approval.confirmReject', '반려 확인')}</Button>
                </>
              : <Button variant="contained" color="error" onClick={() => { setRejectMode(true); setRejectReason('') }} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('approval.reject', '반려')}</Button>
          )}
          {canSee(MENU_REQ, 'REQUESTED', '승인', getRoles(selectedItem)) && selectedItem.status === 'REQUESTED' && !rejectMode && (
            <Button variant="contained" color="success" onClick={() => handleApprove(selectedItem)} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('approval.approve', '승인')}</Button>
          )}
        </Box>

      </Box>
    )
  }

  // ==================== CREATE VIEW ====================
  if (viewMode === 'create') {
    return (
      <Box>
        {/* PC 폼 */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          <Box sx={rowSx}>
            <Typography sx={labelSx}>{t('ppeReq.selectEquipment')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography>
            <Box sx={valSx}>
              <Select fullWidth size="small" displayEmpty value={form.equipmentId?.toString() || ''} onChange={(e) => handleEquipmentSelect(e.target.value)}>
                <MenuItem value="" disabled>{t('ppeReq.selectFromInventory')}</MenuItem>
                {(equipmentData?.content || []).map((eq) => <MenuItem key={eq.id} value={eq.id.toString()}>{eq.name} ({eq.model || ''}) - {t('ppe.stock')}: {eq.stockQuantity}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Box sx={rowSx}><Typography sx={labelSx}>{t('ppeReq.itemName')}</Typography><Box sx={valBorderSx}><TextField fullWidth size="small" value={form.itemName} InputProps={{ readOnly: true }} /></Box><Typography sx={labelSx}>{t('ppeReq.category')}</Typography><Box sx={valSx}><TextField fullWidth size="small" value={getCategoryLabel(form.itemCategory || '')} InputProps={{ readOnly: true }} /></Box></Box>
          <Box sx={rowSx}><Typography sx={labelSx}>{t('ppeReq.model')}</Typography><Box sx={valBorderSx}><TextField fullWidth size="small" value={form.itemModel || ''} InputProps={{ readOnly: true }} /></Box><Typography sx={labelSx}>{t('ppeReq.quantity')}<Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography></Typography><Box sx={valSx}><NumberField fullWidth size="small" min={1} max={maxStock} step={1} disabled={!form.equipmentId} value={form.quantity} onChange={(v) => handleQuantityChange(String(v ?? ''))} helperText={quantityWarning ? t('ppeReq.stockExceedWarning', { max: maxStock }) : form.equipmentId ? `${t('ppe.stock')}: ${maxStock}` : ''} error={quantityWarning} /></Box></Box>
          <Box sx={rowSx}><Typography sx={labelSx}>{t('ppeReq.reason')}</Typography><Box sx={valSx}><TextField fullWidth size="small" multiline rows={2} value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Box></Box>
          <Box sx={{ display: 'flex' }}><Typography sx={labelSx}>{t('common.notes')}</Typography><Box sx={valSx}><TextField fullWidth size="small" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Box></Box>
        </Paper>
        {/* Mobile 폼 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 2 }}>
          <Box><Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppeReq.selectEquipment')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography><FormControl fullWidth size="small"><Select displayEmpty value={form.equipmentId?.toString() || ''} onChange={(e) => handleEquipmentSelect(e.target.value)}><MenuItem value="" disabled>{t('ppeReq.selectFromInventory')}</MenuItem>{(equipmentData?.content || []).map((eq) => <MenuItem key={eq.id} value={eq.id.toString()}>{eq.name} ({eq.stockQuantity})</MenuItem>)}</Select></FormControl></Box>
          <Box><Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppeReq.itemName')}</Typography><TextField fullWidth size="small" value={form.itemName} InputProps={{ readOnly: true }} /></Box>
          <Box><Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppeReq.quantity')} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography></Typography><NumberField fullWidth size="small" min={1} max={maxStock} step={1} disabled={!form.equipmentId} value={form.quantity} onChange={(v) => handleQuantityChange(String(v ?? ''))} helperText={quantityWarning ? t('ppeReq.stockExceedWarning', { max: maxStock }) : form.equipmentId ? `${t('ppe.stock')}: ${maxStock}` : ''} error={quantityWarning} /></Box>
          <Box><Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('ppeReq.reason')}</Typography><TextField fullWidth size="small" multiline rows={2} value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Box>
          <Box><Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.notes')}</Typography><TextField fullWidth size="small" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
          <Button variant="outlined" onClick={() => viewMode === 'edit' ? setViewMode('detail') : handleBackToList()} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: 'none' } }}>{t('common.save')}</Button>
        </Box>
      </Box>
    )
  }

  // ==================== LIST VIEW ====================
  return (
    <Box>
      {/* 검색 - PC */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}>
              <MenuItem value="">{t('ppeReq.allStatus')}</MenuItem>
              {statusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton onClick={() => { setStatusFilter(''); setPage(0) }} size="small"><RefreshIcon /></IconButton>
        </Box>
        {canSee(MENU_REQ, 'LIST', '신청 등록', getRoles()) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>New</Button>
        )}
      </Box>
      {/* 검색 - Mobile */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, mb: 2 }}>
        <FormControl size="small" sx={{ flex: 1 }}>
          <Select displayEmpty value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}>
            <MenuItem value="">{t('ppeReq.allStatus')}</MenuItem>
            {statusCodes.map(c => <MenuItem key={c.code} value={c.code}>{getStatusLabel(c.code)}</MenuItem>)}
          </Select>
        </FormControl>
        {canSee(MENU_REQ, 'LIST', '신청 등록', getRoles()) && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ flex: 1 }}>New</Button>
        )}
      </Box>

      {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      : items.length === 0 ? <Alert severity="info">{t('common.noData')}</Alert>
      : <>
        {/* PC Table */}
        <Paper sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell sx={hSx} align="center">{t('ppeReq.requestId')}</TableCell>
                <TableCell sx={hSx} align="center">{t('ppeReq.itemName')}</TableCell>
                <TableCell sx={hSx} align="center">{t('ppeReq.category')}</TableCell>
                <TableCell sx={hSx} align="center">{t('ppeReq.quantity')}</TableCell>
                <TableCell sx={hSx} align="center">{t('ppeReq.requester')}</TableCell>
                <TableCell sx={hSx} align="center">{t('ppeReq.requestDate')}</TableCell>
                <TableCell sx={hSx} align="center">{t('ppeReq.status')}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.requestId}</TableCell>
                    <TableCell align="center"><Typography variant="body2" fontWeight={600}>{item.itemName}</Typography></TableCell>
                    <TableCell align="center">{getCategoryLabel(item.itemCategory || '')}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{item.quantity}</TableCell>
                    <TableCell align="center">{item.requesterName || ''}</TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDateTime(item.requestDate)}</TableCell>
                    <TableCell align="center"><Chip label={getStatusLabel(item.status)} color={STATUS_COLORS[item.status] || 'default'} size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        {/* Mobile Cards */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {items.map(item => (
            <Paper key={item.id} sx={{ p: 2, border: 1, borderColor: 'divider', cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography fontWeight="bold">{item.itemName}</Typography>
                <Chip label={getStatusLabel(item.status)} color={STATUS_COLORS[item.status] || 'default'} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">{item.requesterName} | {item.quantity}개 | {item.requestDate?.replace('T', ' ').substring(0, 10)}</Typography>
            </Paper>
          ))}
        </Box>
        {totalPages > 1 && <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><Pagination count={totalPages} page={page + 1} onChange={(_, p) => setPage(p - 1)} color="primary" /></Box>}
      </>}
    </Box>
  )
}

export default PpeRequestTab
