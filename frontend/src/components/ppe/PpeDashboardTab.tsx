import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Grid, LinearProgress, Chip, Alert,
} from '@mui/material'
import LoadingOverlay from '../common/LoadingOverlay'
import { ppeItemApi, ppeStockApi, ppeIssueApi, ppeInspectionApi, ppeWearApi, ppeBudgetApi } from '../../api/ppeApi'

const KpiPaper = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
  <Paper sx={(theme: any) => ({
    p: 2.5, pl: 3, position: 'relative', overflow: 'hidden',
    ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }),
    '&::before': {
      content: '""', position: 'absolute', top: 0, bottom: 0, left: 0,
      width: 4, backgroundColor: theme.isYesco ? '#E60012' : color,
      borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit',
    },
  })}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>{value ?? '-'}</Typography>
  </Paper>
)

const PpeDashboardTab: React.FC = () => {
  const { t } = useTranslation()

  const { data: itemKpi, isLoading: l1 } = useQuery({ queryKey: ['ppeItemKpi'], queryFn: ppeItemApi.getKpi })
  const { data: stockKpi, isLoading: l2 } = useQuery({ queryKey: ['ppeStockKpi'], queryFn: ppeStockApi.getKpi })
  const { data: issueKpi, isLoading: l3 } = useQuery({ queryKey: ['ppeIssueKpi'], queryFn: ppeIssueApi.getKpi })
  const { data: inspKpi, isLoading: l4 } = useQuery({ queryKey: ['ppeInspectionKpi'], queryFn: ppeInspectionApi.getKpi })
  const { data: wearKpi, isLoading: l5 } = useQuery({ queryKey: ['ppeWearKpi'], queryFn: ppeWearApi.getKpi })
  const { data: budgetKpi, isLoading: l6 } = useQuery({ queryKey: ['ppeBudgetKpi'], queryFn: () => ppeBudgetApi.getKpi() })
  const { data: wearRate } = useQuery({ queryKey: ['ppeWearDeptRate'], queryFn: ppeWearApi.getDepartmentRate })

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6

  // 카테고리별 통계 (정적 — 실시간 집계는 별도 백엔드 API 필요)
  const categoryStats = [
    { cat: '두부보호(안전모)',     issue: 145, replace: 12, discard: 3,  comply: 98 },
    { cat: '호흡기 보호(마스크)',  issue: 380, replace: 95, discard: 20, comply: 95 },
    { cat: '발 보호(안전화)',      issue: 87,  replace: 8,  discard: 2,  comply: 99 },
    { cat: '눈/안면 보호(보안경)', issue: 62,  replace: 18, discard: 5,  comply: 94 },
    { cat: '손 보호(안전장갑)',    issue: 420, replace: 110, discard: 35, comply: 96 },
    { cat: '추락 보호(안전대)',    issue: 23,  replace: 2,  discard: 0,  comply: 100 },
    { cat: '청력 보호(귀마개)',    issue: 510, replace: 220, discard: 80, comply: 92 },
    { cat: '전신 보호(방호복)',    issue: 15,  replace: 1,  discard: 0,  comply: 100 },
  ]

  // 법정 비치 의무
  const legalStock = [
    { ppe: '안전모',     law: '산안법 제38조',         stock: true,  qty: true },
    { ppe: '안전화',     law: '안전보건규칙 제32조',   stock: true,  qty: true },
    { ppe: '방진마스크', law: '산안법 제38조',         stock: true,  qty: true },
    { ppe: '안전대',     law: '안전보건규칙 제32조',   stock: true,  qty: true },
    { ppe: '귀마개',     law: '소음방지 규정',         stock: true,  qty: true },
    { ppe: '보안경',     law: '안전보건규칙 제32조',   stock: true,  qty: false },
  ]

  return (
    <Box sx={{ position: 'relative' }}>
      <LoadingOverlay open={isLoading} />

      {/* 상단 KPI 통합 (8개 도메인 핵심 지표) */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}><KpiPaper label="등록 품목" value={itemKpi?.totalItems ?? '-'} color="#2563eb" /></Grid>
        <Grid item xs={6} md={3}><KpiPaper label="총 재고" value={stockKpi?.totalQuantity ?? '-'} color="#2563eb" /></Grid>
        <Grid item xs={6} md={3}><KpiPaper label="총 지급" value={issueKpi?.totalIssues ?? '-'} color="#2563eb" /></Grid>
        <Grid item xs={6} md={3}><KpiPaper label="착용 이행율" value={wearKpi != null ? `${wearKpi.complianceRate}%` : '-'} color="#2563eb" /></Grid>
        <Grid item xs={6} md={3}><KpiPaper label="재고 부족" value={stockKpi?.lowStockCount ?? '-'} color="#2563eb" /></Grid>
        <Grid item xs={6} md={3}><KpiPaper label="점검 불합격·폐기" value={inspKpi?.failOrDisposeCount ?? '-'} color="#2563eb" /></Grid>
        <Grid item xs={6} md={3}><KpiPaper label="만료 임박" value={stockKpi?.expiringCount ?? '-'} color="#2563eb" /></Grid>
        <Grid item xs={6} md={3}><KpiPaper label="집행율" value={budgetKpi != null ? `${budgetKpi.spentRate}%` : '-'} color="#2563eb" /></Grid>
      </Grid>

      {/* 통계 테이블 + 부서별 이행율 */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>카테고리별 지급 통계</Typography>
          {/* PC Table */}
          <Paper sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden', borderRadius: 1, mb: 3 }}>
            <TableContainer>
              <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 'bold', borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& th:last-child': { borderRight: 'none' } }}>
                    <TableCell>카테고리</TableCell>
                    <TableCell align="center">지급</TableCell>
                    <TableCell align="center">교체</TableCell>
                    <TableCell align="center">폐기</TableCell>
                    <TableCell align="center">준수율</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryStats.map((c) => (
                    <TableRow key={c.cat} hover>
                      <TableCell>{c.cat}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{c.issue}</TableCell>
                      <TableCell align="center" sx={{ color: 'warning.main' }}>{c.replace}</TableCell>
                      <TableCell align="center" sx={{ color: 'error.main' }}>{c.discard}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={c.comply}
                            color={c.comply >= 98 ? 'success' : c.comply >= 95 ? 'primary' : 'warning'}
                            sx={{ flex: 1, height: 5, borderRadius: 1 }} />
                          <Typography variant="caption" sx={{ minWidth: 32 }}>{c.comply}%</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {/* Mobile cards */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {categoryStats.map((c) => (
              <Paper key={c.cat} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography fontWeight="bold">{c.cat}</Typography>
                  <Chip size="small" label={`${c.comply}%`} color={c.comply >= 98 ? 'success' : c.comply >= 95 ? 'primary' : 'warning'} />
                </Box>
                <Typography variant="body2" color="text.secondary">지급 {c.issue} | 교체 {c.replace} | 폐기 {c.discard}</Typography>
                <LinearProgress variant="determinate" value={c.comply}
                  color={c.comply >= 98 ? 'success' : c.comply >= 95 ? 'primary' : 'warning'}
                  sx={{ mt: 1, height: 5, borderRadius: 1 }} />
              </Paper>
            ))}
          </Box>

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>법정 비치 의무 현황</Typography>
          {/* PC Table */}
          <Paper sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden', borderRadius: 1 }}>
            <TableContainer>
              <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 'bold', borderRight: '1px solid', borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }, '& th:last-child': { borderRight: 'none' } }}>
                    <TableCell>보호구</TableCell>
                    <TableCell align="center">법적 근거</TableCell>
                    <TableCell align="center">비치</TableCell>
                    <TableCell align="center">수량 충족</TableCell>
                    <TableCell align="center">준수</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {legalStock.map((x) => (
                    <TableRow key={x.ppe} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{x.ppe}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>{x.law}</TableCell>
                      <TableCell align="center"><Chip size="small" label={x.stock ? '비치' : '미비치'} color={x.stock ? 'success' : 'error'} /></TableCell>
                      <TableCell align="center"><Chip size="small" label={x.qty ? '충족' : '부족'} color={x.qty ? 'success' : 'warning'} /></TableCell>
                      <TableCell align="center"><Chip size="small" label={x.stock && x.qty ? '✓ 준수' : '△ 점검'} color={x.stock && x.qty ? 'success' : 'warning'} variant="outlined" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {/* Mobile cards */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {legalStock.map((x) => (
              <Paper key={x.ppe} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography fontWeight="bold">{x.ppe}</Typography>
                  <Chip size="small" label={x.stock && x.qty ? '✓ 준수' : '△ 점검'} color={x.stock && x.qty ? 'success' : 'warning'} variant="outlined" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>{x.law}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip size="small" label={x.stock ? '비치' : '미비치'} color={x.stock ? 'success' : 'error'} />
                  <Chip size="small" label={x.qty ? '수량 충족' : '수량 부족'} color={x.qty ? 'success' : 'warning'} />
                </Box>
              </Paper>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>부서별 착용 이행율</Typography>
          <Paper sx={{ p: 2, mb: 3 }}>
            {!wearRate || wearRate.length === 0 ? (
              <Alert severity="info">착용 이행 데이터가 없습니다.</Alert>
            ) : (
              wearRate.map((d) => {
                const rate = d.total_count > 0 ? Math.round(d.ok_count / d.total_count * 100) : 0
                return (
                  <Box key={d.department} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{d.department}</Typography>
                      <Typography variant="body2" fontWeight="bold" color={rate >= 90 ? 'success.main' : rate >= 70 ? 'warning.main' : 'error.main'}>{rate}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={rate}
                      color={rate >= 90 ? 'success' : rate >= 70 ? 'warning' : 'error'}
                      sx={{ height: 8, borderRadius: 1 }} />
                  </Box>
                )
              })
            )}
          </Paper>

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>예산 집행 현황</Typography>
          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">연간 예산</Typography>
              <Typography variant="body2" fontWeight="bold">{(budgetKpi?.totalBudget || 0).toLocaleString()} 원</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">집행 금액</Typography>
              <Typography variant="body2" fontWeight="bold" color="info.main">{(budgetKpi?.totalSpent || 0).toLocaleString()} 원</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">잔여 예산</Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">{(budgetKpi?.remaining || 0).toLocaleString()} 원</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">집행율 {budgetKpi?.spentRate ?? 0}%</Typography>
              <LinearProgress variant="determinate" value={Math.min(100, budgetKpi?.spentRate || 0)}
                color={(budgetKpi?.spentRate || 0) >= 90 ? 'warning' : 'primary'}
                sx={{ height: 10, borderRadius: 1, mt: 0.5 }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default PpeDashboardTab
