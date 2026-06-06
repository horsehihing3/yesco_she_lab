import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, CircularProgress, Alert, Chip, Select, MenuItem, FormControl, Paper,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../api/axiosInstance'
import { EhsPlan, EhsPlanGoal } from '../../types/planKpiGoal.types'
import { ApiResponse } from '../../types/common.types'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { useButtonRules } from '../../hooks/useButtonRules'
import LoadingOverlay from '../common/LoadingOverlay'
import RejectReasonDialog from '../common/RejectReasonDialog'
import useCodeMap from '../../hooks/useCodeMap'
import GoalsTable, { GOAL_TEMPLATE } from './GoalsTable'

const currentYear = new Date().getFullYear()
const FORM_NO = 'IMS-100-1'

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'info'> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  DONE: 'success',
}

const fetchApprovedPlans = async (year: number): Promise<EhsPlan[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsPlan[]>>(`/ehs-plans/approved?year=${year}`)
  return res.data.data || []
}

const fetchPlanDetail = async (id: number): Promise<EhsPlan> => {
  const res = await axiosInstance.get<ApiResponse<EhsPlan>>(`/ehs-plans/${id}`)
  return res.data.data
}

const updatePlan = async ({ id, data }: { id: number; data: Partial<EhsPlan> & { goals: EhsPlanGoal[] } }) => {
  const res = await axiosInstance.put<ApiResponse<EhsPlan>>(`/ehs-plans/${id}`, data)
  return res.data.data
}

type TransitionAction = 'submit' | 'approve' | 'reject' | 'completionSubmit' | 'complete'
const transitionPlan = async ({ id, action, rejectReason }: { id: number; action: TransitionAction; rejectReason?: string }) => {
  const res = await axiosInstance.patch<ApiResponse<EhsPlan>>(`/ehs-plans/${id}/transition`, { action, rejectReason })
  return res.data.data
}

const formatDateOnly = (s?: string | null) => (s ? s.substring(0, 10) : '')

type ViewMode = 'list' | 'detail'

const KpiStatusTab: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showSuccess, showConfirm, showWarning } = useAlert()
  const { getLabel: getStatusLabel } = useCodeMap('PLAN_STATUS')
  const { user: authUser } = useAuth()

  const isAdmin = authUser?.role === 'SYSTEM_ADMIN'
  const { canSee } = useButtonRules()
  const MENU = 'EHS 경영 › 계획·KPI·목표 › KPI 현황'
  const myRoles: string[] = ['guest', ...(isAdmin ? ['superAdmin'] : [authUser?.role ?? ''].filter(Boolean))]
  const getDetailRoles = (item: { writerUserId?: number|null; writerName?: string|null; completionApproverUserId?: number|null; completionApproverName?: string|null }): string[] => {
    const roles = [...myRoles]
    if ((item.writerUserId && authUser?.id && item.writerUserId === authUser.id) ||
        (item.writerName && authUser?.name && item.writerName === authUser.name)) roles.push('writer')
    if ((item.completionApproverUserId && authUser?.id && item.completionApproverUserId === authUser.id) ||
        (item.completionApproverName && authUser?.name && item.completionApproverName === authUser.name)) roles.push('completionApprover')
    return roles
  }
  const canCompletionApprove = (d: { completionApproverUserId?: number | null; completionApproverName?: string | null }) => {
    if (isAdmin) return true
    if (d.completionApproverUserId && authUser?.id && d.completionApproverUserId === authUser.id) return true
    if (d.completionApproverName && authUser?.name && d.completionApproverName === authUser.name) return true
    return false
  }

  const [year, setYear] = useState(currentYear)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editGoals, setEditGoals] = useState<EhsPlanGoal[]>([])
  // 완료 결재 반려 사유 입력 다이얼로그
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['kpiApprovedPlans', year],
    queryFn: () => fetchApprovedPlans(year),
    enabled: viewMode === 'list',
  })

  const { data: detail } = useQuery({
    queryKey: ['ehsPlanDetail', selectedId],
    queryFn: () => fetchPlanDetail(selectedId!),
    enabled: !!selectedId && viewMode === 'detail',
  })

  useEffect(() => {
    if (detail) {
      const saved = detail.goals || []
      // 템플릿 4행 기준으로 매칭
      const goals: EhsPlanGoal[] = GOAL_TEMPLATE.map((tpl, idx) => {
        const s = saved[idx]
        return {
          ...(s || {}),
          goalText: tpl.goalText || '',
          subGoal: tpl.subGoal,
          sortOrder: (idx + 1) * 10,
        }
      })
      setEditGoals(goals)
    }
  }, [detail])

  const updateMutation = useMutation({
    mutationFn: updatePlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['kpiApprovedPlans'] })
      queryClient.invalidateQueries({ queryKey: ['ehsPlanDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
    },
  })

  const transitionMutation = useMutation({
    mutationFn: transitionPlan,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['kpiApprovedPlans'] })
      queryClient.invalidateQueries({ queryKey: ['ehsPlanDetail'] })
      await showSuccess(t('common.saved', '저장되었습니다'))
    },
  })

  const isProcessing = updateMutation.isPending || transitionMutation.isPending

  const handleRowClick = (item: EhsPlan) => {
    setSelectedId(item.id)
    setViewMode('detail')
  }
  const handleBackToList = () => {
    setSelectedId(null)
    setViewMode('list')
  }
  const buildSavePayload = (d: EhsPlan) => ({
    planYear: d.planYear,
    planName: d.planName,
    description: d.description,
    status: d.status,
    priority: d.priority,
    remarks: d.remarks,
    writerUserId: d.writerUserId,
    writerTeam: d.writerTeam,
    writerPosition: d.writerPosition,
    writerName: d.writerName,
    planApproverUserId: d.planApproverUserId,
    planApproverTeam: d.planApproverTeam,
    planApproverPosition: d.planApproverPosition,
    planApproverName: d.planApproverName,
    completionApproverUserId: d.completionApproverUserId,
    completionApproverTeam: d.completionApproverTeam,
    completionApproverPosition: d.completionApproverPosition,
    completionApproverName: d.completionApproverName,
    goals: editGoals,
  })

  const handleSave = async () => {
    if (!detail) return
    const confirmed = await showConfirm(t('common.confirmSave', '저장하시겠습니까?'))
    if (!confirmed) return
    updateMutation.mutate({ id: detail.id, data: buildSavePayload(detail) as any })
  }
  // 완료 결재 상신 — APPROVED → COMPLETION_PENDING (작성자/admin)
  // updateMutation 의 onSuccess 토스트가 transition 의 토스트와 중복되므로
  // 저장은 raw updatePlan() 으로 조용히 처리 후 transitionMutation 만 실행.
  const handleCompletionSubmit = async () => {
    if (!detail) return
    const confirmed = await showConfirm(t('pkg.confirmCompletionSubmit', '완료 결재를 상신하시겠습니까?'))
    if (!confirmed) return
    try {
      await updatePlan({ id: detail.id, data: buildSavePayload(detail) as any })
    } catch { /* transition 으로 계속 진행 */ }
    transitionMutation.mutate({ id: detail.id, action: 'completionSubmit' })
  }

  const handleComplete = async () => {
    if (!detail) return
    if (!canCompletionApprove(detail)) {
      showWarning(t('pkg.notCompletionApprover', '지정된 완료 승인자만 작업 완료 처리할 수 있습니다.'))
      return
    }
    const confirmed = await showConfirm(t('pkg.confirmComplete', '완료 결재를 승인하시겠습니까?'))
    if (!confirmed) return
    transitionMutation.mutate({ id: detail.id, action: 'complete' })
  }

  const updateGoal = (idx: number, patch: Partial<EhsPlanGoal>) => {
    setEditGoals(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }

  const headerSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }
  const labelSx = {
    width: 120, minWidth: 120, fontWeight: 'bold', bgcolor: 'grey.100',
    px: 2, py: 1.5, borderRight: 1, borderColor: 'grey.300',
    display: 'flex', alignItems: 'center', fontSize: '0.875rem',
    justifyContent: 'center', wordBreak: 'keep-all' as const, textAlign: 'center' as const,
  }
  const valSx = { flex: 1, px: 2, py: 1, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }
  const valBorderSx = { ...valSx, borderRight: 1, borderColor: 'grey.300' }
  const rowSx = { display: 'flex', borderBottom: 1, borderColor: 'grey.300' }

  // ===== LIST =====
  if (viewMode === 'list') {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                <MenuItem key={y} value={y}>{y}년</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {t('pkg.kpiStatusHint', '연간 계획 중 승인된 항목이 KPI 현황으로 표시됩니다.')}
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info">{t('pkg.noApprovedKpi', '승인된 KPI 항목이 없습니다. 연간 계획 탭에서 KPI로 등록할 항목을 승인해 주세요.')}</Alert>
        ) : (
          <TableContainer component={Paper} sx={{ border: 1, borderColor: 'grey.300' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headerSx, width: 50 }} align="center">{t('common.no')}</TableCell>
                  <TableCell sx={headerSx} align="center">{t('pkg.formNo', '서식번호')}</TableCell>
                  <TableCell sx={headerSx} align="center">{t('pkg.planYear', '연도')}</TableCell>
                  <TableCell sx={headerSx}>{t('pkg.planName', '계획명')}</TableCell>
                  <TableCell sx={headerSx} align="center">{t('pkg.writer', '작성')}</TableCell>
                  <TableCell sx={headerSx} align="center">{t('pkg.planApprover', '계획 승인자')}</TableCell>
                  <TableCell sx={headerSx} align="center">{t('pkg.completionApprover', '완료 승인자')}</TableCell>
                  <TableCell sx={headerSx} align="center">{t('pkg.status', '상태')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((p, idx) => (
                  <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(p)}>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell align="center">{FORM_NO}</TableCell>
                    <TableCell align="center">{p.planYear}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{p.planName}</Typography></TableCell>
                    <TableCell align="center">{p.writerName || ''}</TableCell>
                    <TableCell align="center">{p.planApproverName || ''}</TableCell>
                    <TableCell align="center">{p.completionApproverName || ''}</TableCell>
                    <TableCell align="center">
                      {/* KPI 현황 관점 상태 표기 */}
                      {(() => {
                        if (p.status === 'APPROVED') {
                          return <Chip size="small" label={t('common.draft', '작성중')} color="default" />
                        }
                        if (p.status === 'COMPLETION_PENDING') {
                          return <Chip size="small" label={t('pkg.completionPending', '완료 결재 대기')} color="warning" />
                        }
                        if (p.status === 'DONE') {
                          return <Chip size="small" label={t('common.done', '완료')} color="success" />
                        }
                        return <Chip size="small" label={getStatusLabel(p.status) || p.status} color={STATUS_COLORS[p.status] || 'default'} />
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    )
  }

  // ===== DETAIL =====
  if (!detail) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }
  const d = detail
  return (
    <Box>
      {/* 완료 결재 반려 사유 배너 — APPROVED 상태로 되돌아온 경우 사유 노출 */}
      {d.rejectReason && d.status === 'APPROVED' && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', border: 1, borderColor: 'error.light', borderRadius: 1 }}>
          <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ mb: 0.5 }}>
            {t('common.rejectReasonTitle', '반려 사유')}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{d.rejectReason}</Typography>
        </Box>
      )}
      <LoadingOverlay open={isProcessing} />
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 720, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.formNo', '서식번호')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{FORM_NO}</Typography></Box>
            <Box sx={labelSx}>{t('pkg.planYear', '연도')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.planYear}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.planName', '계획명')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.planName}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.description', '설명')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.description || ''}</Typography></Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.createdDate', '작성일자')}</Box>
            <Box sx={valBorderSx}><Typography variant="body2">{formatDateOnly(d.createdAt)}</Typography></Box>
            <Box sx={labelSx}>{t('pkg.status', '상태')}</Box>
            <Box sx={valSx}>
              {(() => {
                if (d.status === 'APPROVED') {
                  return <Chip size="small" label={t('common.draft', '작성중')} color="default" />
                }
                if (d.status === 'COMPLETION_PENDING') {
                  return <Chip size="small" label={t('pkg.completionPending', '완료 결재 대기')} color="warning" />
                }
                if (d.status === 'DONE') {
                  return <Chip size="small" label={t('common.done', '완료')} color="success" />
                }
                return <Chip size="small" label={getStatusLabel(d.status) || d.status} color={STATUS_COLORS[d.status] || 'default'} />
              })()}
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.writer', '작성')}</Box>
            <Box sx={valSx}>
              <Typography variant="body2">
                {[d.writerTeam, d.writerPosition, d.writerName].filter(Boolean).join(' / ') || ''}
              </Typography>
            </Box>
          </Box>
          <Box sx={rowSx}>
            <Box sx={labelSx}>{t('pkg.planApprover', '계획 승인자')}</Box>
            <Box sx={valBorderSx}>
              <Typography variant="body2">
                {[d.planApproverTeam, d.planApproverPosition, d.planApproverName].filter(Boolean).join(' / ') || ''}
              </Typography>
            </Box>
            <Box sx={labelSx}>{t('pkg.completionApprover', '완료 승인자')}</Box>
            <Box sx={valSx}>
              <Typography variant="body2">
                {[d.completionApproverTeam, d.completionApproverPosition, d.completionApproverName].filter(Boolean).join(' / ') || ''}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ ...rowSx, borderBottom: 0 }}>
            <Box sx={labelSx}>{t('common.remarks', '비고')}</Box>
            <Box sx={valSx}><Typography variant="body2">{d.remarks || ''}</Typography></Box>
          </Box>
        </Box>
      </Box>

      <GoalsTable
        goals={editGoals}
        mode={d.status === 'DONE' ? 'kpiReadOnly' : 'kpi'}
        onChange={updateGoal}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        <Button variant="outlined" onClick={handleBackToList}>{t('common.backToList', '목록')}</Button>
        {d.status === 'APPROVED' && canSee(MENU, 'APPROVED', '저장 (KPI 값)', getDetailRoles(d)) && (
          <Button variant="contained" onClick={handleSave}>{t('common.save', '저장')}</Button>
        )}
        {d.status === 'APPROVED' && canSee(MENU, 'APPROVED', '완료 결재 상신', getDetailRoles(d)) && (
          <Button variant="contained" color="info" onClick={handleCompletionSubmit}>
            {t('pkg.completionSubmit', '완료 결재 상신')}
          </Button>
        )}
        {d.status === 'COMPLETION_PENDING' && canCompletionApprove(d) && canSee(MENU, 'COMPLETION_PENDING', '반려', getDetailRoles(d)) && (
          <Button variant="contained" color="warning" onClick={() => setRejectDialogOpen(true)}>
            {t('pkg.reject', '반려')}
          </Button>
        )}
        {d.status === 'COMPLETION_PENDING' && canCompletionApprove(d) && canSee(MENU, 'COMPLETION_PENDING', '완료 승인', getDetailRoles(d)) && (
          <Button variant="contained" color="success" onClick={handleComplete}>
            {t('pkg.completionApprove', '완료 승인')}
          </Button>
        )}
      </Box>

      {/* 완료 결재 반려 사유 입력 다이얼로그 */}
      <RejectReasonDialog
        open={rejectDialogOpen}
        stage={t('pkg.completionReject', '완료 결재 반려')}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={(reason) => {
          if (detail) {
            transitionMutation.mutate({ id: detail.id, action: 'reject', rejectReason: reason })
          }
          setRejectDialogOpen(false)
        }}
        loading={transitionMutation.isPending}
      />
    </Box>
  )
}

export default KpiStatusTab
