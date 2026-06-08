import { formatUserName } from '../../utils/userDisplay'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableRow,
} from '@mui/material'
import { emergencyDrillApi, emergencyPlanApi } from '../../api/emergencyExtendedApi'
import { EmergencyDrill, EmergencyPlan } from '../../types/emergencyExtended.types'
import ReportListWrapper, { ReportColumn } from '../common/ReportListWrapper'
import useCodeMap from '../../hooks/useCodeMap'
import SafetyChecklistTab from './SafetyChecklistTab'

// 레포트 표시·필터를 위해 drill 에 plan 의 모든 필드를 합쳐 둔 enriched 타입
type EnrichedDrill = EmergencyDrill & Partial<EmergencyPlan> & {
  planIdString?: string
}

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const todayIso = () => new Date().toISOString().substring(0, 10)
const monthsAgoIso = (months: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().substring(0, 10)
}

const EmrReportTab: React.FC = () => {
  const { t } = useTranslation()
  const { getLabel: getPlanTypeLabel } = useCodeMap('EMERGENCY_PLAN_TYPE')

  const [startDate, setStartDate] = useState<string>(monthsAgoIso(3))
  const [endDate, setEndDate] = useState<string>(todayIso())

  const { data, isLoading } = useQuery({
    queryKey: ['emrReportAll'],
    queryFn: () => emergencyDrillApi.getAll(0, 1000),
  })

  const { data: plansData } = useQuery({
    queryKey: ['emrReportAllPlans'],
    queryFn: () => emergencyPlanApi.getAll(0, 1000),
  })

  const reports = useMemo<EnrichedDrill[]>(() => {
    const drillList: EmergencyDrill[] = (data as any)?.content || []
    const planList: EmergencyPlan[] = (plansData as any)?.content || []
    const planById = new Map<number, EmergencyPlan>()
    planList.forEach(p => planById.set(p.id, p))

    const enriched: EnrichedDrill[] = drillList.map(d => {
      const plan = d.planId ? planById.get(d.planId) : undefined
      const merged: EnrichedDrill = {
        ...(plan as object), // plan 의 모든 필드 (planName/planType/responsibleDept/trainingStart·EndDate/계획·완료 승인자 등)
        ...d,                  // drill 본인 필드가 우선 (id, drillId, drillName, status 등)
        planIdString: plan?.planId,        // 문자열 plan_id (EP-2026-001)
        planName: plan?.planName || d.drillName,
        planType: plan?.planType || d.drillType,
        responsibleDept: plan?.responsibleDept || d.targetDept,
        trainingStartDate: plan?.trainingStartDate,
        trainingEndDate: plan?.trainingEndDate,
        completionApprovedAt: plan?.completionApprovedAt,
      }
      return merged
    })

    const s = startDate || ''
    const e = endDate || ''
    const pickDate = (i: EnrichedDrill) =>
      (i.completionApprovedAt || i.trainingEndDate || i.scheduledDate || i.createdAt || '').substring(0, 10)
    return enriched
      .filter((i) => i.status === 'DONE' || i.status === 'COMPLETED')
      .filter((i) => {
        const d = pickDate(i)
        if (!d) return false
        if (s && d < s) return false
        if (e && d > e) return false
        return true
      })
      .sort((a, b) => pickDate(b).localeCompare(pickDate(a)))
  }, [data, plansData, startDate, endDate])

  const reportDate = todayIso()

  const renderReport = (item: EnrichedDrill, idx: number, total: number) => (
    <Paper sx={{ p: 3, bgcolor: 'grey.50', '@media print': { pageBreakAfter: 'always', breakAfter: 'page' } }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          {t('emr.report.title', '비상 훈련 레포트')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.reportDate', '보고일')}: {reportDate}
          {' · '}
          {t('common.no', 'No')}. {idx + 1} / {total}
        </Typography>
      </Box>

      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
        1. {t('emr.report.overviewTitle', '훈련 개요')}
      </Typography>
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('emr.planId', '계획번호')}</TableCell>
              <TableCell sx={{ width: '30%', fontFamily: 'monospace' }}>{item.planIdString || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100', width: '20%' }}>{t('emr.planType', '유형')}</TableCell>
              <TableCell sx={{ width: '30%' }}>{getPlanTypeLabel(item.planType || item.drillType || '') || item.planType || item.drillType || ''}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('emr.planName', '훈련명')}</TableCell>
              <TableCell colSpan={3} sx={{ fontWeight: 600 }}>{(item as any).planName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('emr.responsibleDept', '담당 부서')}</TableCell>
              <TableCell>{(item as any).responsibleDept || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('emr.responsibleName', '담당자')}</TableCell>
              <TableCell>{(item as any).responsibleName || ''}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.startDate', '시작일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{((item as any).trainingStartDate || '').substring(0, 10)}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.endDate', '종료일')}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{((item as any).trainingEndDate || '').substring(0, 10)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.planApprover', '계획 승인자')}</TableCell>
              <TableCell>{formatUserName((item as any).planApproverTeam, (item as any).planApproverName, (item as any).planApproverPosition) || ''}</TableCell>
              <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('common.completionApprover', '완료 승인자')}</TableCell>
              <TableCell>{formatUserName((item as any).completionApproverTeam, (item as any).completionApproverName, (item as any).completionApproverPosition) || ''}</TableCell>
            </TableRow>
            {(item as any).description && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('emr.description', '설명')}</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{(item as any).description}</TableCell>
              </TableRow>
            )}
            {(item as any).responseSteps && (
              <TableRow>
                <TableCell sx={{ ...headerCellSx, bgcolor: 'grey.100' }}>{t('emr.responseSteps', '대응 절차')}</TableCell>
                <TableCell colSpan={3} sx={{ whiteSpace: 'pre-wrap' }}>{(item as any).responseSteps}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 2. 체크리스트 — 연결된 plan 의 checklist_template_id 가 있을 때만 노출 */}
      {item.checklistTemplateId && (
        <>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
            2. {t('emr.report.checklistTitle', '체크리스트')}
          </Typography>
          <Box sx={{
            mb: 3,
            // 첨부파일 컬럼 (11번째) 숨김 — 화면·인쇄 공통
            '& tr > th:nth-of-type(11), & tr > td:nth-of-type(11)': { display: 'none' },
            // 인쇄 시 체크리스트 표가 페이지 폭 (A4) 을 넘지 않도록 압축
            '@media print': {
              '& .MuiTableContainer-root': { overflow: 'visible !important' },
              '& table': { minWidth: '0 !important', width: '100% !important', tableLayout: 'fixed' },
              '& .MuiTableCell-root': { fontSize: '0.6rem !important', padding: '2px 3px !important', wordBreak: 'break-word', whiteSpace: 'normal !important' },
              '& input, & textarea, & .MuiInputBase-root, & .MuiInputBase-input': { fontSize: '0.6rem !important', padding: '1px 2px !important' },
              '& .MuiTextField-root .MuiOutlinedInput-notchedOutline': { border: '0 !important' },
              // 컬럼 폭 명시 지정 (10개 컬럼 합계 100%): No / 분류 / 점검항목 / 법적근거 / 적합 / 부적합 / 해당없음 / 지적사항 / 조치기한 / 조치완료
              '& tr > th:nth-of-type(1),  & tr > td:nth-of-type(1)':  { width: '3% !important', minWidth: '0 !important' },
              '& tr > th:nth-of-type(2),  & tr > td:nth-of-type(2)':  { width: '6% !important', minWidth: '0 !important' },
              '& tr > th:nth-of-type(3),  & tr > td:nth-of-type(3)':  { width: '32% !important', minWidth: '0 !important' },
              '& tr > th:nth-of-type(4),  & tr > td:nth-of-type(4)':  { width: '10% !important', minWidth: '0 !important' },
              '& tr > th:nth-of-type(5),  & tr > td:nth-of-type(5)':  { width: '5% !important', minWidth: '0 !important' },
              '& tr > th:nth-of-type(6),  & tr > td:nth-of-type(6)':  { width: '5% !important', minWidth: '0 !important' },
              '& tr > th:nth-of-type(7),  & tr > td:nth-of-type(7)':  { width: '5% !important', minWidth: '0 !important' },
              '& tr > th:nth-of-type(8),  & tr > td:nth-of-type(8)':  { width: '18% !important', minWidth: '0 !important' },
              '& tr > th:nth-of-type(9),  & tr > td:nth-of-type(9)':  { width: '10% !important', minWidth: '0 !important' },
              '& tr > th:nth-of-type(10), & tr > td:nth-of-type(10)': { width: '6% !important', minWidth: '0 !important' },
            },
          }}>
            <SafetyChecklistTab templateId={item.checklistTemplateId} embedded showSummary hideSignatures locked />
          </Box>
        </>
      )}

      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('audit.report.footer', '본 보고서는 EHS 시스템에서 자동 생성되었습니다.')}
        </Typography>
      </Box>
    </Paper>
  )

  const columns: ReportColumn<EnrichedDrill>[] = [
    { header: t('emr.planId', '계획번호'), align: 'center', width: 130, render: (r) => r.planIdString || r.drillId || '' },
    { header: t('emr.planName', '훈련명'), render: (r) => r.planName || r.drillName || '' },
    { header: t('emr.planType', '유형'), align: 'center', width: 170, render: (r) => <span style={{ whiteSpace: 'nowrap' }}>{getPlanTypeLabel(r.planType || r.drillType || '') || r.planType || r.drillType || ''}</span> },
    { header: t('emr.responsibleDept', '담당 부서'), align: 'center', width: 200, render: (r) => r.responsibleDept || r.targetDept || '' },
    { header: t('common.startDate', '시작일'), align: 'center', width: 110, render: (r) => (r.trainingStartDate || r.scheduledDate || '').substring(0, 10) },
    { header: t('common.endDate', '종료일'), align: 'center', width: 110, render: (r) => (r.trainingEndDate || '').substring(0, 10) },
    { header: t('emr.completionApprovedDate', '완료 승인일'), align: 'center', width: 130, render: (r) => (r.completionApprovedAt || '').substring(0, 10) },
  ]

  return (
    <ReportListWrapper<EnrichedDrill>
      items={reports}
      columns={columns}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      isLoading={isLoading}
      emptyMessage={t('emr.report.noData', '완료 결재 승인된 비상 훈련이 없습니다.')}
      renderReport={renderReport}
    />
  )
}

export default EmrReportTab
