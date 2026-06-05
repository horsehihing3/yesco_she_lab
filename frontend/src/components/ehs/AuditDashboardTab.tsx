import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, LinearProgress, Alert,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import GradeIcon from '@mui/icons-material/Grade'
import TimelineIcon from '@mui/icons-material/Timeline'
import { auditApi, auditFindingApi } from '../../api/auditApi'
import useCodeMap from '../../hooks/useCodeMap'

const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PLAN: 'default',
  PREPARING: 'warning',
  IN_PROGRESS: 'info',
  PENDING_CLOSE: 'info',
  COMPLETED: 'success',
}

const headerCellSx = { fontWeight: 'bold', whiteSpace: 'nowrap' as const }

const AuditDashboardTab: React.FC = () => {
  const { t } = useTranslation()
  const { getLabel: getAuditTypeLabel } = useCodeMap('AUDIT_TYPE')
  const { getLabel: getAuditStatusLabel } = useCodeMap('AUDIT_STATUS')
  const { getLabel: getSeverityLabel } = useCodeMap('FINDING_SEVERITY')

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audits', 0],
    queryFn: () => auditApi.getAll(0, 100),
  })

  const { data: findingData } = useQuery({
    queryKey: ['auditFindings', 0],
    queryFn: () => auditFindingApi.getAll(0, 100),
  })

  const audits = auditData?.content || []
  const findings = findingData?.content || []

  const totalAudits = audits.length
  const completedAudits = audits.filter((a) => a.status === 'COMPLETED').length
  const complianceRate = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL').length
  const minorFindings = findings.filter((f) => f.severity === 'MINOR').length
  const observationFindings = findings.filter((f) => f.severity === 'OBSERVATION').length

  const gradeMap: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 }
  const gradedAudits = audits.filter((a) => a.grade)
  const avgGradeNum = gradedAudits.length > 0
    ? gradedAudits.reduce((sum, a) => sum + (gradeMap[a.grade || 'C'] || 1), 0) / gradedAudits.length
    : 0
  const avgGradeLabel = avgGradeNum >= 3.5 ? 'S' : avgGradeNum >= 2.5 ? 'A' : avgGradeNum >= 1.5 ? 'B' : 'C'

  const plannedCount = audits.filter((a) => a.status === 'PLAN').length
  const inProgressCount = audits.filter((a) => a.status === 'IN_PROGRESS').length

  const recentAudits = [...audits].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Paper sx={{ p: 2, borderTop: '3px solid', borderColor: 'primary.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AssignmentIcon color="primary" fontSize="small" />
            <Typography variant="caption" color="text.secondary">{t('audit.annualPlan')}</Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main">{totalAudits}</Typography>
        </Paper>
        <Paper sx={{ p: 2, borderTop: '3px solid', borderColor: 'success.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUpIcon color="success" fontSize="small" />
            <Typography variant="caption" color="text.secondary">{t('audit.complianceRate')}</Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="success.main">{complianceRate}%</Typography>
        </Paper>
        <Paper sx={{ p: 2, borderTop: '3px solid', borderColor: 'error.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ReportProblemIcon color="error" fontSize="small" />
            <Typography variant="caption" color="text.secondary">{t('audit.findingSummary')}</Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="error.main">{findings.length}</Typography>
          <Typography variant="caption" color="text.secondary">
            {getSeverityLabel('CRITICAL')} {criticalFindings} / {getSeverityLabel('MINOR')} {minorFindings} / {getSeverityLabel('OBSERVATION')} {observationFindings}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, borderTop: '3px solid', borderColor: 'warning.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <GradeIcon color="warning" fontSize="small" />
            <Typography variant="caption" color="text.secondary">{t('audit.avgGrade')}</Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="warning.main">{gradedAudits.length > 0 ? avgGradeLabel : ''}</Typography>
        </Paper>
      </Box>

      {/* 2-column: Phase Progress + Recent Activity */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Phase Progress */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TimelineIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight="bold">{t('audit.phaseProgress')}</Typography>
          </Box>
          {[
            { label: getAuditStatusLabel('PLAN'), count: plannedCount, total: totalAudits, color: 'secondary' },
            { label: getAuditStatusLabel('IN_PROGRESS'), count: inProgressCount, total: totalAudits, color: 'info' },
            { label: getAuditStatusLabel('COMPLETED'), count: completedAudits, total: totalAudits, color: 'success' },
          ].map((item, idx) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{item.label}</Typography>
                <Typography variant="body2" fontWeight="bold">{item.count} / {item.total}</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={item.total > 0 ? (item.count / item.total) * 100 : 0}
                color={item.color as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
        </Paper>

        {/* Recent Activity Timeline */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{t('audit.recentActivity')}</Typography>
          {recentAudits.length === 0 ? (
            <Alert severity="info">{t('common.noData')}</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {recentAudits.slice(0, 6).map((audit) => (
                <Box key={audit.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ minWidth: 80 }}>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {audit.auditDate || audit.createdAt?.slice(0, 10)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{audit.auditName}</Typography>
                    <Typography variant="caption" color="text.secondary">{audit.targetDept || ''} {audit.auditor || ''}</Typography>
                  </Box>
                  <Chip label={getAuditStatusLabel(audit.status)} color={statusColors[audit.status]} size="small" />
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Recent Audits Table */}
      <Paper sx={{ px: 2, pb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ py: 2 }}>{t('audit.recentAudits')}</Typography>
        {recentAudits.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>{t('common.noData')}</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>{t('audit.auditId')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('audit.auditName')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('audit.auditType')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('audit.targetDept')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('audit.auditor')}</TableCell>
                  <TableCell sx={headerCellSx}>{t('audit.grade')}</TableCell>
                  <TableCell sx={headerCellSx} align="center">{t('common.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentAudits.map((audit) => (
                  <TableRow key={audit.id} hover>
                    <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{audit.auditId}</TableCell>
                    <TableCell><Typography fontWeight={600} variant="body2">{audit.auditName}</Typography></TableCell>
                    <TableCell align="center">{getAuditTypeLabel(audit.auditType)}</TableCell>
                    <TableCell align="center">{audit.targetDept || ''}</TableCell>
                    <TableCell align="center">{audit.auditor || ''}</TableCell>
                    <TableCell align="center">
                      {audit.grade ? (
                        <Chip
                          label={audit.grade}
                          size="small"
                          color={audit.grade === 'S' ? 'success' : audit.grade === 'A' ? 'primary' : audit.grade === 'B' ? 'warning' : 'error'}
                        />
                      ) : ''}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={getAuditStatusLabel(audit.status)} color={statusColors[audit.status]} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export default AuditDashboardTab
