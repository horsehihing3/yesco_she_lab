import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Grid, Paper, Typography, CircularProgress, Chip } from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import ScienceIcon from '@mui/icons-material/Science'
import EngineeringIcon from '@mui/icons-material/Engineering'
import { psmApi } from '../../api/psmApi'
import StatCard from '../legalCompliance/StatCard'

const PsmDashboardTab: React.FC = () => {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: ['psm-dashboard'], queryFn: psmApi.dashboardSummary })

  if (isLoading || !data) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  const totalData = data.totalEquip + data.totalChem + data.totalPower + data.totalVessel + data.totalPipe + data.totalPsv


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold">{t('psm.dashboardTitle', 'PSM 대시보드')}</Typography>

      <Grid container spacing={1.5}>
        <Grid item xs={6} md={3}><StatCard label={t('psm.totalData', '공정안전자료')}    value={totalData}            sub="6분류 합계" /></Grid>
        <Grid item xs={6} md={3}><StatCard label={t('psm.totalMoc', 'MOC 진행 중')}      value={data.mocInProgress}   sub={`전체 ${data.totalMoc}건`} /></Grid>
        <Grid item xs={6} md={3}><StatCard label={t('psm.totalHazop', 'HAZOP 검토')}     value={data.totalHazop}      sub="등록 건수" /></Grid>
        <Grid item xs={6} md={3}><StatCard label={t('psm.expiring', '만료 임박/초과')} value={data.expiringCount}   sub="90일 이내" /></Grid>
      </Grid>

      <Paper sx={(theme: any) => ({ p: 2, ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AssignmentIcon fontSize="small" />{t('psm.dataByCategory', '분류별 자료 건수')}
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6} md={2}><Chip icon={<EngineeringIcon />} label={`설비명세 ${data.totalEquip}`} variant="outlined" sx={{ width: '100%' }} /></Grid>
          <Grid item xs={6} md={2}><Chip icon={<ScienceIcon />} label={`유해위험물질 ${data.totalChem}`} variant="outlined" sx={{ width: '100%' }} /></Grid>
          <Grid item xs={6} md={2}><Chip icon={<AutorenewIcon />} label={`동력기계 ${data.totalPower}`} variant="outlined" sx={{ width: '100%' }} /></Grid>
          <Grid item xs={6} md={2}><Chip icon={<EventAvailableIcon />} label={`장치·설비 ${data.totalVessel}`} variant="outlined" sx={{ width: '100%' }} /></Grid>
          <Grid item xs={6} md={2}><Chip icon={<WarningAmberIcon />} label={`배관 ${data.totalPipe}`} variant="outlined" sx={{ width: '100%' }} /></Grid>
          <Grid item xs={6} md={2}><Chip icon={<WarningAmberIcon />} label={`PSV ${data.totalPsv}`} variant="outlined" sx={{ width: '100%' }} /></Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default PsmDashboardTab
